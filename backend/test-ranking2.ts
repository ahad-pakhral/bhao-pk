import fs from 'fs';

// Temporarily hijack rankProducts to prevent score stripping and add console.logs for each component
let rankingCode = fs.readFileSync('./src/services/ranking.service.ts', 'utf8');

// replace the return statement to not strip _score
rankingCode = rankingCode.replace(
  'return scored.map(({ _score, ...product }) => product);',
  'return scored as any;'
);

// We want to see exact stats 
rankingCode = rankingCode.replace(
  'return { ...product, _score: score };',
  `console.log("----", product.name);
   console.log("Relevance:", relevance);
   console.log("Price Score:", priceScore, "Price:", product.price);
   console.log("Base Score:", WEIGHTS.relevance * relevance + WEIGHTS.bayesianRating * normalizedBayesian + WEIGHTS.priceScore * priceScore + WEIGHTS.popularity * popularity + WEIGHTS.storeReliability * storeReliability + WEIGHTS.discountBonus * discountBonus);
   console.log("Final Score after Penalties:", score);
   return { ...product, _score: score };`
);

fs.writeFileSync('./test-ranking-temp.ts', rankingCode);
