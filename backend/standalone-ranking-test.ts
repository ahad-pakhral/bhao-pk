const STORE_RELIABILITY: Record<string, number> = {
    Daraz: 0.85,
    Telemart: 0.80,
    Shophive: 0.75,
    Mega: 0.70,
    PriceOye: 0.80,
};

const WEIGHTS = {
    relevance: 0.50,
    priceScore: 0.20,
    bayesianRating: 0.10,
    popularity: 0.10,
    storeReliability: 0.05,
    discountBonus: 0.05,
};

const CONFIDENCE_THRESHOLD = 25;

function bayesianAverage(rating: number, reviewCount: number, globalAvg: number): number {
    return (CONFIDENCE_THRESHOLD * globalAvg + reviewCount * rating) /
        (CONFIDENCE_THRESHOLD + reviewCount);
}

function calculateRelevance(productName: string, query: string): number {
    if (!query) return 1.0;

    const normalizedName = productName.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedName.includes(normalizedQuery)) {
        return Math.max(0.8, 1 - (normalizedName.length - normalizedQuery.length) / 100);
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
    if (queryTokens.length === 0) return 1.0;

    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let matches = 0;
    for (const token of queryTokens) {
        const escapedToken = escapeRegExp(token);
        let regex = new RegExp(`\\b${escapedToken}\\b`, 'i');

        if (regex.test(normalizedName)) {
            matches++;
        } else if (token.length > 4) {
            let partialMatch = false;
            for (let i = 0; i < token.length; i++) {
                const typoToken = token.substring(0, i) + token.substring(i + 1);
                if (typoToken.length >= 4) {
                    const typoRegex = new RegExp(`\\b${escapeRegExp(typoToken)}\\b`, 'i');
                    if (typoRegex.test(normalizedName)) {
                        partialMatch = true;
                        break;
                    }
                }
            }
            if (partialMatch) matches += 0.8;
        }
    }

    return matches / queryTokens.length;
}

const ACCESSORY_KEYWORDS = ['case', 'cover', 'protector', 'glass', 'cable', 'charger', 'lens', 'strap', 'band', 'silicone', 'shell', 'bumper'];

function testRankLogs() {
    const products = [
        { name: 'Oraimo Watch 6 Pro (OSW-807S)', price: 7399, store: 'Shophive', rating: 0, reviewsCount: 0, inStock: true },
        { name: 'Google Pixel 6 Pro - 256GB', price: 101478, store: 'Daraz', rating: 5, reviewsCount: 1, inStock: true }
    ] as any[];

    const query = "google pixel 6 pro";

    const totalRating = products.reduce((sum, p) => sum + p.rating, 0);
    const globalAvg = totalRating / products.length;

    const minPrice = 7399;
    const maxPrice = 101478;
    const maxReviews = 1;
    const normalizedQuery = query.toLowerCase().trim();
    const queryWantsAccessory = ACCESSORY_KEYWORDS.some(kw => normalizedQuery.includes(kw));

    products.forEach(product => {
        const relevance = calculateRelevance(product.name, query);
        const bayesian = bayesianAverage(product.rating, product.reviewsCount, globalAvg);
        const normalizedBayesian = Math.max(0, Math.min(1, (bayesian - 1) / 4));

        let priceScore = 0;
        if (product.price > 0) {
            const logPrice = Math.log(product.price);
            const logMin = Math.log(minPrice);
            const logMax = Math.log(maxPrice);
            priceScore = logMax > logMin ? 1 - ((logPrice - logMin) / (logMax - logMin)) : 1;
        }

        const popularity = maxReviews > 1 ? Math.log(1 + product.reviewsCount) / Math.log(1 + maxReviews) : 0;
        const storeReliability = STORE_RELIABILITY[product.store] || 0.70;
        const discountBonus = 0;

        let score =
            WEIGHTS.relevance * relevance +
            WEIGHTS.bayesianRating * normalizedBayesian +
            WEIGHTS.priceScore * priceScore +
            WEIGHTS.popularity * popularity +
            WEIGHTS.storeReliability * storeReliability +
            WEIGHTS.discountBonus * discountBonus;

        console.log(`\n--- PRODUCT: ${product.name} ---`);
        console.log(`Relevance: ${relevance.toFixed(3)} | BaseWeight: ${(relevance * WEIGHTS.relevance).toFixed(3)}`);
        console.log(`Bayesian Rating: ${normalizedBayesian.toFixed(3)} | BaseWeight: ${(normalizedBayesian * WEIGHTS.bayesianRating).toFixed(3)}`);
        console.log(`Price Score: ${priceScore.toFixed(3)} | BaseWeight: ${(priceScore * WEIGHTS.priceScore).toFixed(3)}`);
        console.log(`Popularity: ${popularity.toFixed(3)} | BaseWeight: ${(popularity * WEIGHTS.popularity).toFixed(3)}`);
        console.log(`Store Rel: ${storeReliability.toFixed(3)} | BaseWeight: ${(storeReliability * STORE_RELIABILITY[product.store]).toFixed(3)}`);
        console.log(`Base Score Before Penalties: ${score.toFixed(4)}`);

        if (relevance < 1.0) {
            score *= 0.1;
            console.log(`-> APPLIED PARTIAL MATCH PENALTY: Score becomes ${score.toFixed(4)}`);
        }

        const isAccessory = ACCESSORY_KEYWORDS.some(kw => product.name.toLowerCase().includes(kw));
        if (!queryWantsAccessory && isAccessory) {
            score *= 0.4;
            console.log(`-> APPLIED ACCESSORY PENALTY: Score becomes ${score.toFixed(4)}`);
        }

        console.log(`FINAL SCORE: ${score.toFixed(4)}`);
    });
}

testRankLogs();
