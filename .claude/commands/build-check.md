# Build Check — Verify All Components Build Successfully

Run type checks and builds across all project components. Report any failures.

## Run These Checks

### 1. Backend TypeScript
```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/backend && npx tsc --noEmit
```

### 2. Webapp Build
```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/webapp && npx next build
```

### 3. Python Scrapers Syntax Check
```bash
cd /Users/ahad/Documents/Clawd/Bhao.pk/backend/scrapers && \
source .venv/bin/activate && \
python3 -c "
from stores.daraz_scraper import DarazScraper
from stores.shophive_scraper import ShophiveScraper
from stores.telemart_scraper import TelemartScraper
from stores.mega_scraper import MegaScraper
from stores.priceoye_scraper import PriceOyeScraper
print('All scrapers import successfully')
"
```

## Common Build Failures and Fixes

### `rankByRelevance` type error
The generic function `rankByRelevance<T>()` requires `T` to have `originalPrice?: string`. If your product type uses `originalPrice?: number`, either:
- Change the type to `string` and format it as `Rs. X,XXX`
- Use explicit generic: `rankByRelevance<YourType>(products)`

### `Property X does not exist on type Y`
The mobile and webapp have SEPARATE type definitions:
- `mobile/src/types/models.ts`
- `webapp/types/models.ts`

If you add a field, add it to BOTH files.

### `Cannot find module` in scrapers
Make sure you run from the `backend/scrapers/` directory (not `backend/`), because Python imports use relative paths like `from stores.base_scraper import BaseScraper`.

### Next.js Suspense boundary error
Any page using `useSearchParams()` must be wrapped in `<Suspense>`. The search page already does this.

## After Fixing

If you fix a build issue, run `/update-skills` to record the fix pattern.
