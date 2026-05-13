# Bhao.pk: Price Comparison & Intelligent Tracking Platform
## Final Year Project Presentation Outline

### Section 1: Introduction & The Problem Space
*   **Mission**: To revolutionize price transparency in Pakistan's fragmented e-commerce market.
*   **The Problem**: 
    *   **Price Fragmentation**: Identical products listed at drastically different prices across Daraz, Telemart, and Shophive.
    *   **Search Noise**: Store search results are cluttered with 90% accessories (cases, screen protectors) when searching for high-value electronics.
    *   **Manual Tracking Exhaustion**: Users have to manually refresh multiple tabs daily to find price drops.
*   **The Solution**: A unified cross-platform ecosystem (Web + Mobile) that retrieves, ranks, and tracks products intelligently.

### Section 2: Core Architecture — Two-Stage Retrieval
*   **Concept**: We don't trust store search rankings. We treat them as raw data.
*   **Stage 1: Retrieval (The Scrapers)**: 
    *   Custom scrapers (Python/Node.js) bypass Client-Side Rendering blocks.
    *   High Recall: We pull every possible candidate from target stores (100-300 results per search).
*   **Stage 2: Precision Ranking (The Algorithm)**:
    *   Our server-side engine re-ranks every single result based on our own 6-signal composite scoring.

### Section 3: The Ranking Algorithm (Secret Sauce)
*   **Text Relevance (50%)**: Position-aware token matching. Words at the start of a title (e.g., "iPhone 16") score higher than words buried in descriptions.
*   **Price Score (20%)**: Log-normalized scoring that favors cheaper deals without over-penalizing premium listings.
*   **Bayesian Rating (10%)**: Statistically weighted ratings. A 4.5-star product with 2,000 reviews outranks a 5.0-star product with only 2 reviews.
*   **Popularity (10%)**: Normalized review counts to identify established, trusted sellers.
*   **Store Reliability (5%)**: Weighted trust scores for Daraz, Shophive, and Telemart.
*   **Discount Bonus (5%)**: Small boost for products with genuine active sales.

### Section 4: Hard Filters & Noise Reduction
*   **Accessory Penalty (97% Reduction)**: Automatic detection of keywords like "Case," "Cover," or "Protector" to bury accessories when a user searches for a device.
*   **Generation Mismatch**: Sophisticated logic that prevents an "iPhone 14" from appearing when a user specifically searches for "iPhone 16."
*   **Out-of-Stock Deprioritization**: Keeping the catalog complete but ensuring available items always appear first.

### Architecture Overview

```
                    Scraped Products (unranked, ~100-300)
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                   ▼
           ┌────────────────┐  ┌──────────────┐  ┌───────────────┐
           │  PRE-PROCESS   │  │  GLOBAL STATS│  │ QUERY ANALYSIS│
           │  IQR Price     │  │  avgRating   │  │ wantsAccessory│
           │  Outlier Filter│  │  maxReviews  │  │               │
           └───────┬────────┘  └──────┬───────┘  └───────┬───────┘
                   │                  │                   │
                   └──────────────────┼───────────────────┘
                                      ▼
                        ┌─────────────────────────┐
                        │  PER-PRODUCT SCORING    │
                        │  (loop over each item)  │
                        └────────────┬────────────┘
                                     │
              ┌──────────────────────┼───────────────────────┐
              ▼                      ▼                        ▼
     ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────┐
     │  STAGE 1: GATES │   │ STAGE 2: 6-SIGNAL│   │ STAGE 3: FILTERS │
     │                  │   │  COMPOSITE SCORE │   │  (post-score)    │
     │ • Relevance = 0? │   │                  │   │                  │
     │   → ELIMINATE    │   │ • Relevance  50% │   │ • Out of stock  │
     │ • Generic phrase?│   │ • Price      20% │   │   ×0.1 penalty   │
     │   → ELIMINATE    │   │ • Rating     10% │   │ • Generation    │
     │                  │   │ • Popularity 10% │   │   mismatch       │
     └────────┬────────┘   │ • Store Rel   5% │   │   ×0.01-0.4     │
              │            │ • Discount    5% │   │ • Accessory      │
              ▼            └────────┬─────────┘   │   ×0.03 penalty  │
     ┌─────────────────┐            │             │                  │
     │  SURVIVED GATES │◄───────────┘             └────────┬─────────┘
     │  → Calculate 6  │                                     │
     │    signals      │◄────────────────────────────────────┘
     └────────┬────────┘
              ▼
     ┌─────────────────┐
     │  FINAL SCORE     │
     │  = Σ(weight×sig) │
     │  × genPenalty    │
     │  × stockPenalty  │
     │  × accPenalty    │
     └────────┬────────┘
              ▼
     ┌─────────────────┐
     │  SORT by score   │
     │  DESCENDING      │
     └────────┬────────┘
              ▼
     ┌─────────────────┐
     │  STRIP _score    │
     │  RETURN ranked[] │
     └─────────────────┘
```

### Section 5: Smart Price Alerts & Cross-Store Tracking
*   **The Problem**: Most alerts are tied to a single URL. If the price drops on a *different* store, the user misses out.
*   **The Bhao.pk Solution**: 
    *   **Cross-Store Snapshots**: One alert tracks the same product across Daraz, Telemart, and Shophive simultaneously.
    *   **Best Current Price**: The alert triggers if *any* store hits the target price.
    *   **Alternative Discovery**: The system suggests 3 "Better Value" alternatives (cheaper or higher-rated) in the same category.
    *   **Notification Engine**: Real-time email triggers via the Resend API.

### Section 6: Technical Implementation & Stack
*   **Frontend**: Next.js (Web) and React Native/Expo (Mobile) for a seamless cross-platform experience.
*   **Backend**: Node.js microservices with Supabase for authentication and relational data.
*   **Database Philosophy (The Transient Model)**: 
    *   **PostgreSQL**: Stores persistent user data (Wishlists, Alerts).
    *   **Redis Caching**: Temporary storage for scraped product data (1-hour TTL) to ensure legal compliance and high performance.
*   **Visualization**: Dynamic SVG charts for interactive price history tracking.

### Section 7: Testing & Quality Assurance
*   **Methodology**: Rigorous Black Box testing against live e-commerce data.
*   **Key Test Cases**:
    *   Verification of the "Accessory Penalty" during high-volume searches.
    *   Cron job reliability for 30-minute alert checks.
*   **Outcome**: 100% of the 27 Functional Requirements successfully verified.

### Section 8: Legal Design & Sustainability
*   **Fair Use Compliance**: We extract factual market data (prices, names) which are not copyrightable.
*   **Privacy First**: Secure Supabase authentication with Row-Level Security (RLS) policies.
*   **Scalability**: The modular scraper architecture allows adding a new store in under 1 hour by implementing a single interface.

### Section 9: Future Roadmap
*   **AI Integration**: Moving from keyword-based relevance to Vector Embeddings (Semantic Search).
*   **Predictive Analytics**: Using historical price data to predict "When to Buy" (Market Lows).
*   **Merchant API**: Allowing local small-scale sellers to list products alongside major e-commerce giants.

### Section 10: Conclusion
*   Bhao.pk is not just a scraper; it is an intelligent decision-support system.
*   It solves real-world price fragmentation in Pakistan through custom-built algorithmic ranking and cross-store monitoring.
*   **Status**: Feature-complete, tested, and ready for deployment.
