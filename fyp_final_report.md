# Bhao.pk - Final Year Project Report

## Chapter 1: Introduction

### 1.1 Project Overview
Bhao.pk is a web-based price comparison platform specifically designed for the Pakistani e-commerce ecosystem. The application aggregates product data from multiple online retailers, enabling users to find the best deals without manually visiting each store.

### 1.2 Problem Statement
Consumers in Pakistan often face price discrepancies across different e-commerce platforms. Manually tracking prices, comparing products, and identifying genuine discounts is a time-consuming process that leads to suboptimal purchasing decisions.

### 1.3 Proposed Solution
The proposed solution is a unified web application that serves as a centralized hub for product discovery and price comparison. The platform integrates a smart search engine, historical price tracking, and an automated alert system to ensure consumers can make informed, cost-effective purchases.

### 1.4 Tools and Technologies
The system is built using a modern, web-only technology stack. The deployment topology utilizes cloud-native services for high availability and scalability:

1. **Frontend:** Next.js 14, React 18, Zustand (State Management), Recharts (Data Visualization).
2. **Backend:** Node.js, Express, TypeScript, Python (for web scraping and NLP classification).
3. **Database:** PostgreSQL (managed via Prisma ORM) and Supabase (Authentication).
4. **Caching:** Redis.
5. **Machine Learning:** Scikit-learn (Joblib model for query routing).
6. **Deployment:** 
   a. Frontend deployed on Vercel (`vercel.json` configured for Next.js build).
   b. Backend deployed on Render via Docker (`Dockerfile` multi-runtime container for Node.js and Python).
   c. Custom Domain configured at `bhao.pk`.

### 1.5 Scope
The scope of the project encompasses the development of a fully functional web application, a robust backend API, and a suite of Python-based scrapers targeting major Pakistani retailers (such as Daraz, Telemart, and Shophive).

### 1.6 Timeline
The project timeline spans from the initial repository creation to the final deployment and UI polish phases:

1. **Phase 1:** Initial setup, repository creation, and scaffolding (Initial commit).
2. **Phase 2:** Database schema design, authentication APIs, and Prisma integration.
3. **Phase 3:** Development of core search algorithms, Bayesian ranking, and product matching services.
4. **Phase 4:** Implementation of rich alert cards, price tracking, and email notification systems.
5. **Phase 5:** Integration of the machine learning query routing model and optimization of search latency.
6. **Phase 6:** Removal of the mobile application and complete redesign of the web frontend for a unified user experience.
7. **Phase 7:** Final deployment configurations for Docker, Vercel, and Render.

---

## Chapter 2: Requirements

### 2.1 Functional Requirements

1. **FR-01:** The system shall aggregate and display product listings from multiple e-commerce platforms. (Implemented)
2. **FR-02:** The system shall feature a "Trending Products" section on the homepage. (Implemented)
3. **FR-03:** The system shall provide real-time search suggestions based on trending and recently viewed items while the user is typing. (Implemented)
4. **FR-04:** The system shall maintain and display a list of recently viewed products for the user. (Implemented)
5. **FR-05:** The system shall feature a unified product page that compares prices from multiple vendors for the same item. (Implemented)
6. **FR-06:** The system shall allow users to search for products using natural language or specific keywords. (Implemented)
7. **FR-07:** The system shall aggregate search results simultaneously from multiple stores. (Implemented)
8. **FR-08:** The system shall rank and sort search results using a Bayesian average and price scoring algorithm. (Implemented)
9. **FR-09:** The system shall allow users to filter results by specific store. (Implemented)
10. **FR-10:** The system shall filter out price outliers dynamically to ensure relevant price ranges. (Implemented)
11. **FR-11:** The system shall display a detailed product information page including specifications and reviews. (Implemented)
12. **FR-12:** The system shall provide a direct link to open the original product listing on the vendor's site. (Implemented)
13. **FR-13:** The system shall allow users to sign up using an email address and password. (Implemented)
14. **FR-14:** The system shall allow registered users to log in with valid credentials. (Implemented)
15. **FR-15:** The system shall allow authenticated users to securely log out. (Implemented)
16. **FR-16:** The system shall provide a password recovery mechanism via email. (Implemented)
17. **FR-17:** The system shall allow users to set target price alerts for specific products. (Implemented)
18. **FR-18:** The system shall send an email notification when a product's price drops to or below the user's target price. (Implemented)
19. **FR-19:** The system shall generate a graphical chart representing the price history of a product over time. (Implemented)
20. **FR-20:** The system shall allow users to add products to a personal Wishlist. (Implemented)
21. **FR-21:** The system shall allow users to remove products from their Wishlist. (Implemented)
22. **FR-22:** The system shall schedule automated price refresh checks at regular intervals. (Implemented)
23. **FR-23:** The system shall provide a secure backend dashboard for administrators. (Implemented)
24. **FR-24:** The system shall display system statistics (e.g., active users, scraped products) to administrators. (Implemented)
25. **FR-25:** The system shall automatically assign and display a "Best price" badge for the lowest-priced vendor on a unified product page. (Implemented)
26. **FR-26:** The system shall generate personalized product recommendations based on the user's browsing and search history. (Implemented)

### 2.2 Non-Functional Requirements

1. **NFR-01 (Performance):** The system shall utilize concurrent scraping and caching mechanisms to deliver search results efficiently.
2. **NFR-02 (Scalability):** The backend shall be containerized via Docker to allow horizontal scaling on cloud infrastructure.
3. **NFR-03 (Usability):** The web interface shall be fully responsive, ensuring accessibility across desktop and mobile browsers.
4. **NFR-04 (Security):** User passwords shall be cryptographically hashed, and authentication shall rely on secure tokens.

### 2.3 Use Case Descriptions

1. **Search Product:** The user enters a keyword in the search bar. The system routes the query via a machine learning classifier, spawns parallel scrapers for Daraz, Telemart, and Shophive, aggregates the results, applies Bayesian ranking, and displays the normalized product list.
2. **View Product Details:** The user selects a product from the search results. The system retrieves product details, historical price data points, and cross-store matches, displaying them alongside a price history graph and a multi-vendor comparison grid.
3. **Set Price Alert:** An authenticated user defines a target price for a product. The system saves this preference and continuously monitors the product's price via a scheduled cron job, triggering an email when the condition is met.

### 2.4 System Sequence Diagrams (Textual Description)

1. **Search Execution Sequence:** 
   a. User submits a search query via the frontend.
   b. Frontend sends a POST request to the `/api/search` endpoint.
   c. Backend invokes the `ClassifierService` to determine if the query is natural language or keyword-based.
   d. Backend spawns Python scraper processes concurrently for supported stores.
   e. Scrapers return raw JSON data to the Node.js backend.
   f. Backend normalizes, ranks, and filters the data.
   g. Backend returns the processed JSON array to the frontend for rendering.

2. **Price Alert Sequence:**
   a. Cron job triggers the `checkAlerts` function every 30 minutes.
   b. Backend retrieves all active, un-notified alerts from the PostgreSQL database.
   c. For each alert, backend invokes the scraper service for the specific product URL.
   d. If the current scraped price is less than or equal to the target price, backend fetches the user's email.
   e. Backend dispatches an email via the Email Service (Brevo/Resend).
   f. Backend updates the database to mark the alert as notified.

---

## Chapter 3: System Design

### 3.1 System Architecture
The application employs a decoupled client-server architecture. The frontend operates as a statically generated and server-rendered Next.js application, communicating with the backend exclusively via RESTful APIs. 

### 3.2 Deployment Topology
1. **Frontend Layer:** Hosted on Vercel, providing edge caching, global CDN distribution, and optimized asset delivery.
2. **API Layer:** Hosted on Render.com utilizing a custom Docker image (`Dockerfile`). The container runs a Node.js environment alongside a Python 3 virtual environment to support both the Express server and the Python scraping scripts.
3. **Data Layer:** PostgreSQL database managed by Prisma ORM, supplemented by Supabase for authentication services. Redis is utilized for short-term caching of search results and trending items.

### 3.3 UI Design (Web App Screens)
The user interface has been exclusively designed for modern web browsers, featuring a responsive, clean aesthetic.

1. **Home Screen (`/`):** Features a prominent search bar with real-time dropdown suggestions. Below the hero section, it displays a grid of "Trending now", "Recently Viewed", and "Recommended For You" product cards.
2. **Search Results Screen (`/search`):** Displays a grid or list of scraped products. The interface includes filtering options and clearly highlights prices, store badges, and discount percentages.
3. **Product Detail Screen (`/product/[id]`):** A comprehensive view showcasing the product image, specifications, and customer reviews. The right column features the current price, a graphical Price History chart (using Recharts), and a "Compare Prices" section displaying alternative vendors.
4. **Authentication Screens (`/login`, `/signup`, `/forgot-password`, `/reset-password`):** Secure, minimalist forms for user onboarding and session management.
5. **Dashboard Screens (`/wishlist`, `/alerts`, `/history`, `/profile`):** Personalized views allowing users to manage saved items, active price trackers, and account settings.

### 3.4 Domain Model
The core domain model comprises several central data entities designed to track user interactions and preferences:

1. **User:** The central entity representing a registered individual on the platform. It holds identity and authorization data.
2. **WishlistItem:** Represents a product that a User has bookmarked for future reference. It stores essential metadata about the product directly rather than linking to a rigid product catalog, given the dynamic scraping nature of the application.
3. **PriceAlert:** Represents a tracking configuration created by a User for a specific product, defining the target price threshold for notifications.
4. **SearchHistory:** Represents a log of search queries performed by a User, utilized to generate personalized recommendations.

The relationships between these entities are defined as one-to-many associations originating from the User. Specifically, a single User entity can have multiple associated WishlistItem records, PriceAlert records, and SearchHistory records. All subordinate entities are strictly bound to one parent User.

### 3.5 Entity Relationship Diagram (Textual Description)
The database structure is normalized around the User entity, with foreign key relationships establishing the hierarchy:

1. **User Table:** Acts as the primary parent table. The primary key is a unique identifier `id`. Key fields include unique `email`, hashed `password`, `name`, and `role`.
2. **WishlistItem Table:** Contains a primary key `id`. It holds a foreign key `userId` that directly references the primary key of the User table. Key product pointer fields include `store`, `url`, `name`, and `imageUrl`.
3. **PriceAlert Table:** Contains a primary key `id`. It holds a foreign key `userId` that directly references the primary key of the User table. Key fields include `targetPrice`, `keyword`, `productUrl`, and an `isNotified` status flag.
4. **SearchHistory Table:** Contains a primary key `id`. It holds a foreign key `userId` that directly references the primary key of the User table. The primary data field is `query`.

### 3.6 Database Schema
The exact schema structure, as defined by the Prisma ORM implementation, specifies the following tables and constraints:

1. **User Table**
   a. **Columns:** `id` (String, Primary Key, UUID), `email` (String), `password` (String), `name` (String, Nullable), `role` (String, Default 'USER'), `createdAt` (DateTime), `updatedAt` (DateTime).
   b. **Constraints:** Unique constraint on the `email` column.

2. **WishlistItem Table**
   a. **Columns:** `id` (String, Primary Key, UUID), `userId` (String), `store` (String), `url` (String), `name` (String), `imageUrl` (String, Nullable), `createdAt` (DateTime).
   b. **Constraints:** Foreign Key on `userId` referencing `User.id` with Cascade Delete behavior. Unique composite index defined on `[userId, url]` to prevent duplicate bookmarks.

3. **PriceAlert Table**
   a. **Columns:** `id` (String, Primary Key, UUID), `userId` (String), `targetPrice` (Float), `keyword` (String, Nullable), `productUrl` (String, Nullable), `isNotified` (Boolean, Default false), `createdAt` (DateTime), `updatedAt` (DateTime).
   b. **Constraints:** Foreign Key on `userId` referencing `User.id` with Cascade Delete behavior.

4. **SearchHistory Table**
   a. **Columns:** `id` (String, Primary Key, UUID), `userId` (String), `query` (String), `createdAt` (DateTime).
   b. **Constraints:** Foreign Key on `userId` referencing `User.id` with Cascade Delete behavior.

---

## Chapter 4: Software Development

### 4.1 Coding Standards
The project adheres to strict coding standards to maintain consistency across the TypeScript and React environments:

1. **Indentation and Formatting:** The entire codebase utilizes a 2-space indentation rule.
2. **Naming Conventions:**
   a. **Variables and Functions:** Standard variables and function declarations utilize `camelCase` (e.g., `scrapedProduct`, `handleSearch`).
   b. **Components and Types:** React components, TypeScript interfaces, and types consistently utilize `PascalCase` (e.g., `ProductDetail`, `TrendingProduct`).
   c. **Constants:** Environment variables and global configuration constants utilize `UPPER_SNAKE_CASE` (e.g., `API_BASE`, `TRENDING_CACHE_KEY`).
3. **Declaration Conventions:** The `const` keyword is strictly preferred for variable declarations that do not require reassignment, ensuring immutability where possible. TypeScript types and interfaces are explicitly declared for all complex object structures to guarantee type safety across API boundaries.
4. **Statement Standards:** Single quotes are predominantly used for standard string literals and module imports within Node.js backend files, while double quotes are standard practice for JSX/TSX attributes in the frontend React application. Semicolons are explicitly required at the end of all executable statements.

### 4.2 Modules and Logic

1. **Product Search Module:**
   The search module accepts user queries, determines intent using a Python-based classifier, and concurrently scrapes multiple e-commerce sites.
   ```typescript
   export async function searchAllStores(keyword: string, page: number = 1): Promise<ScrapedProduct[]> {
     const results = await Promise.allSettled(
       STORES.map(store => scrapeStore(keyword, store, page))
     );
     // ... aggregates fulfilled results
   }
   ```

2. **Price Ranking and Sorting Module:**
   Results are scored using a Bayesian average algorithm that considers relevance, price normalization, store reliability, and merchant trust.
   ```typescript
   function bayesianAverage(rating: number, reviewCount: number, globalAvg: number): number {
     return (CONFIDENCE_THRESHOLD * globalAvg + reviewCount * rating) /
       (CONFIDENCE_THRESHOLD + reviewCount);
   }
   ```

3. **User Authentication Module:**
   Manages secure access utilizing JWTs and Supabase integration, handling registration, login, and token validation.

4. **Wishlist Management Module:**
   Allows users to bookmark products. State is managed on the client side via Zustand and persisted to the PostgreSQL database.
   ```typescript
   const result = await toggleWishlist({
     store: product.store,
     url: product.url,
     name: product.name,
     imageUrl: product.image,
   });
   ```

5. **Price Alert Module:**
   A background worker that periodically scrapes tracked URLs and dispatches emails when price conditions are met.
   ```typescript
   export function startAlertChecker() {
     cron.schedule('*/30 * * * *', () => {
       checkAlerts();
     });
   }
   ```

### 4.3 Development Environment
The project is developed using TypeScript for both frontend and backend to ensure type safety. The backend leverages Node.js (Express) alongside a virtual Python environment to execute BeautifulSoup/Selenium scrapers. The database schema is strictly typed and migrated using Prisma.

---

## Chapter 5: Testing

### 5.1 Test Cases (Web Application)

| Date | System | Objective | Test ID | Version | Test Type | Input | Expected Result | Actual Result |
|---|---|---|---|---|---|---|---|---|
| [NEEDS INPUT] | Web | Verify keyword search | TC-01 | 1.0 | Functional | Enter "iPhone 15" and submit | System displays aggregated results from Daraz, Telemart, Shophive | [RUN AND FILL IN] |
| [NEEDS INPUT] | Web | Verify price sorting | TC-02 | 1.0 | Functional | Perform search, observe order | Results are ranked dynamically by the Bayesian scoring system | [RUN AND FILL IN] |
| [NEEDS INPUT] | Web | Verify store filtering | TC-03 | 1.0 | Functional | Select "Daraz" filter | Only Daraz products are displayed | [RUN AND FILL IN] |
| [NEEDS INPUT] | Web | Verify user registration | TC-04 | 1.0 | Functional | Valid email and password | Account created, user redirected to home | [RUN AND FILL IN] |
| [NEEDS INPUT] | Web | Verify user login | TC-05 | 1.0 | Functional | Valid credentials | Session initiated, dashboard accessible | [RUN AND FILL IN] |
| [NEEDS INPUT] | Web | Verify user logout | TC-06 | 1.0 | Functional | Click "Logout" | Session terminated, redirected to login | [RUN AND FILL IN] |
| [NEEDS INPUT] | Web | Verify wishlist addition | TC-07 | 1.0 | Functional | Click Wishlist icon on product | Product appears in /wishlist route | [RUN AND FILL IN] |
| [NEEDS INPUT] | Web | Verify target price alert | TC-08 | 1.0 | Functional | Submit target price of 50000 | Alert saved in database, visible in /alerts | [RUN AND FILL IN] |

### 5.2 Test Results Summary
[NEEDS INPUT: Provide a brief summary of the overall pass/fail rate after executing the test cases above.]

---

## Chapter 6: Deployment

### 6.1 Deployment Strategy
The platform utilizes a modern CI/CD approach separating the frontend client from the API backend.

1. **Frontend (Vercel):**
   The Next.js web application is deployed on Vercel. The `vercel.json` file dictates the build configuration:
   `"buildCommand": "npm run build"`
   `"installCommand": "npm ci"`
   Vercel automatically provisions the SSL certificates and hosts the application at the custom domain `bhao.pk`.

2. **Backend (Render):**
   The Node.js and Python hybrid API is deployed on Render via a custom Docker container. 
   The `Dockerfile` executes the following setup:
   a. Uses a slim Node 20 base image.
   b. Installs Python 3, `pip`, and `venv`.
   c. Installs Python scraper dependencies (`requirements.txt`) into an isolated virtual environment.
   d. Installs Node.js dependencies and compiles the TypeScript source code (`npx tsc`).
   e. Exposes the API on the dynamically assigned environment port.

3. **Environment Variables:**
   Both platforms require strictly configured environment variables including `DATABASE_URL` for PostgreSQL, Supabase keys, email provider keys (`BREVO_API_KEY`), and CORS configurations linking the backend to `bhao.pk`.

---

## Chapter 7: Evaluation

The Bhao.pk web application successfully fulfills its primary objective of providing a centralized, efficient price comparison platform for the Pakistani market. By orchestrating concurrent Python scrapers through a Node.js backend, the system demonstrates high efficiency, retrieving live data from multiple vendors without noticeable degradation in user experience. The integration of a machine learning classifier ensures that diverse user queries—ranging from specific product codes to natural language requests—are handled intelligently, increasing the relevance of the output. 

Output quality is significantly enhanced by the proprietary Bayesian ranking algorithm, which effectively filters out irrelevant accessories and anomalous pricing, presenting the user with clean, actionable data. Furthermore, the transition to a purely web-based, responsive interface (facilitated by Next.js) has simplified the deployment pipeline and unified the user experience. The automated email alerting system functions reliably as a background process, adding substantial long-term value for users tracking fluctuating e-commerce prices.

---

## References

1. Next.js Documentation, Vercel Inc. [Online]. Available: https://nextjs.org/docs
2. Prisma ORM Documentation. [Online]. Available: https://www.prisma.io/docs
3. Supabase Documentation. [Online]. Available: https://supabase.com/docs
4. "Scikit-learn: Machine Learning in Python," Pedregosa et al., JMLR 12, pp. 2825-2830, 2011.

---

## Appendix: User Manual

1. **Navigation:** Visit `bhao.pk` via any modern web browser.
2. **Searching:** Use the prominent search bar on the homepage to find products. You can type exact model names or general queries.
3. **Comparing Prices:** Click on any product card to view the detailed comparison page. The "Compare Prices" section will automatically display alternative vendors offering the same item.
4. **Setting Alerts:** On a product page, click "Track price". Log in (or create an account) and enter your desired target price. You will receive an email automatically when the price drops.
5. **Managing Wishlist:** Click the heart icon on any product to save it. Access your saved items by navigating to the "Wishlist" section in your user dashboard.
