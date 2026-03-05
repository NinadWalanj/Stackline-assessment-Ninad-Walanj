# StackShop : Bug Fix & Enhancement Report

## Overview

This document describes every bug identified during review, how each was fixed, and the enhancements made to the application.

---

## Identified Bugs and Fixes

### UX Issues

#### UX-1: No way to deselect a category without clearing the search term

**Problem:** The category `<Select>` had no "All Categories" option. Once a category was chosen, the only way to reset it was the "Clear Filters" button, which also wiped the active search query. Users had no way to broaden back to all categories while keeping their search text.

**Fix:** Added `<SelectItem value="all">All Categories</SelectItem>` as the first item in the category dropdown. In the `handleCategoryChange` handler, `"all"` is treated as clearing the selection: `value === "all" ? undefined : value`. This makes the controls independent — users can clear the category without losing their search.

---

#### UX-2: Loading spinner stuck forever on network failure

**Problem:** The products `fetch` call had no `.catch()` handler. If the request failed (network error, server down), `setLoading(false)` was never called. The page would display "Loading products..." indefinitely with no way to recover.

**Fix:** Added `.catch(() => { setProducts([]); setLoading(false); })` to all three fetch calls (products, categories, subcategories). This ensures the loading state always resolves and the UI transitions to an empty state rather than hanging.

---

#### UX-3: "Showing 20 products" hides actual result count

**Problem:** The result count label always said "Showing 20 products" regardless of how many total products matched the query, because the `total` field from the API response was not being used. With a search that returned 150 products, users saw no indication that more results existed beyond the current page.

**Fix:** Added a `total` state variable populated from `data.total`. The label now renders:

- `"Showing 1–20 of 150 products"` when results span multiple pages
- `"Showing 12 products"` when all results fit on one page

This gives users accurate context about what they're seeing.

---

#### UX-4: Browser tab shows "Create Next App"

**Problem:** The page metadata was never updated from the Next.js scaffolding default. Every browser tab and bookmark showed "Create Next App".

**Fix:** Updated `app/layout.tsx` metadata:

```ts
export const metadata: Metadata = {
  title: "StackShop",
  description: "Browse and discover products on StackShop",
};
```

---

### Design Problems

#### DESIGN-1: Default Geist font — no brand typography

**Problem:** The application used Geist, the Next.js scaffold default. There was no typographic hierarchy between body text and headings, and nothing that read as a deliberate brand choice.

**Fix:** Replaced Geist with two Google Fonts via `next/font/google`:

- **Inter** (`--font-inter`) — clean, legible sans-serif for body and UI text
- **Plus Jakarta Sans** (`--font-jakarta`) — geometric display font for headings, giving headings a distinct, modern feel

In `app/globals.css`, mapped these to the Tailwind CSS variables and added consistent heading rules:

```css
--font-sans: var(--font-inter);
--font-display: var(--font-jakarta);

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-display), var(--font-sans), sans-serif;
  letter-spacing: -0.025em;
  line-height: 1.2;
}
body {
  font-family: var(--font-sans), sans-serif;
  line-height: 1.6;
  font-size: 15px;
}
```

**Note on a subtle bug found here:** The original CSS had `--font-display: var(--font-display)` — a self-referential variable that resolved to nothing. Fixed by naming the Next.js font variable `--font-jakarta` and referencing it as `--font-display: var(--font-jakarta)`.

---

#### DESIGN-2: Search icon not vertically centred

**Problem:** The search icon inside the input field used `top-3` positioning, which is a fixed pixel offset. On different screen sizes or when the input height changed, the icon was visually off-centre.

**Fix:** Replaced `top-3` with `top-1/2 -translate-y-1/2` for true vertical centring, and added `pointer-events-none` so the icon doesn't intercept clicks meant for the input:

```tsx
<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
```

Also gave the input a focus-activated style: `bg-muted/50 border-transparent focus:border-border focus:bg-background` — the field visually "activates" on focus rather than always appearing fully bordered.

---

#### DESIGN-3: Product card layout broken — image not flush, button misaligned

**Problem:** The product card had several layout issues:

- The Card component's default padding was creating a gap above the product image (it wasn't flush with the card top edge)
- The "View Details" button was positioned inconsistently across cards with different title lengths — on short-title cards it floated near the middle; on long-title cards it was at the bottom
- `CardTitle` inherits `leading-none` from shadcn, compressing multi-line titles

**Fix:** Rebuilt the card structure:

- Added `p-0` to `<Card>` to override the default `py-6 gap-6`, letting the image area start at the true top edge
- Added `overflow-hidden` so image corners are clipped by the card's border radius
- Used raw `div` elements for content areas instead of `CardHeader`/`CardContent`/`CardFooter` for precise padding control
- Applied `flex flex-col flex-1` to the content area with `mt-auto` on the badge row — this pushes badges and the button to the bottom regardless of title length
- Pinned the button in its own `px-4 pb-4` div so it's always at the same vertical position across the grid

---

#### DESIGN-4: Excessive spacing in Features card on product detail page

**Problem:** The Features card on the product detail page had `CardContent` with a default `pt-6` class stacked on top of the Card's own `py-6` padding. This produced ~48px of whitespace between the "Features" heading and the top of the card, which looked broken.

**Fix:** Removed the `pt-6` override from `CardContent`, leaving the Card's standard padding to handle spacing uniformly.

---

### Functionality Bugs

#### FUNC-1: Subcategory dropdown showed all subcategories regardless of selected category

**Problem:** The subcategories fetch called `/api/subcategories` without any query parameter. The API supports `?category=...` filtering but the frontend never sent it. After selecting "Electronics", the subcategory dropdown would show subcategories from every category in the dataset.

**Fix:** Updated the fetch to pass the selected category:

```ts
fetch(`/api/subcategories?category=${encodeURIComponent(selectedCategory)}`);
```

---

#### FUNC-2: Product detail page crashed on incomplete URL data

**Problem:** The home page serialised the entire product object as JSON into the URL query string (`?product={...}`). This had two failure modes:

1. The `Product` interface on the home page omitted `featureBullets` and `retailerSku` fields that the detail page required, so those fields were always `undefined`
2. The page threw a runtime `TypeError` when trying to call `.filter()` on `undefined` featureBullets

**Fix:** Changed the link to pass only the SKU: `query: { sku: product.stacklineSku }`. The product detail page now reads the SKU from the URL and fetches the full product from `/api/products/[sku]`. This guarantees all fields are present and server-validated. Added proper `loading` and `error` states with user-facing messages.

---

#### FUNC-3: Blank product grid when switching between categories

**Problem:** When switching from one non-null category to another (e.g., "Electronics" to "Sports"), the `selectedSubCategory` was not being reset. The products fetch ran with `category=Sports&subCategory=Headphones` — a subcategory that doesn't exist under Sports — returning zero results and showing a blank grid.

**Root cause:** The `useEffect` that reset `selectedSubCategory` only ran in the `else` branch (when `selectedCategory` became falsy). It never reset when switching between two non-null categories.

**Fix:** Moved all related state resets into the `handleCategoryChange` event handler function. React 18 automatically batches state updates within event handlers, so `setSelectedCategory`, `setSelectedSubCategory(undefined)`, and `setPage(1)` all execute synchronously before a single re-render, ensuring the products fetch always runs with a consistent, valid filter combination.

---

#### FUNC-4: No pagination — only first 20 products accessible

**Problem:** The API supported `limit` and `offset` parameters for pagination, but the frontend had no page controls. With 1,000+ products in the dataset, users could only ever see the first 20.

**Fix:** Added `page` state, Previous/Next buttons with disabled states at boundaries, and offset calculation: `offset: (page - 1) * LIMIT`. The result count label shows which slice is currently visible (e.g., "Showing 21–40 of 150 products"). Page resets to 1 whenever any filter changes.

---

#### FUNC-5: Runtime crash — `imageUrls` and `featureBullets` can be undefined

**Problem:** Several products in the dataset have `imageUrls: undefined` or `featureBullets: undefined`. Direct property access (`product.imageUrls[0]`, `product.featureBullets.filter(...)`) threw `TypeError: Cannot read properties of undefined` at runtime.

**Fix:** Applied optional chaining and nullish coalescing throughout both pages:

- `product.imageUrls?.[selectedImage]`
- `(product.imageUrls?.length ?? 0) > 1`
- `(product.imageUrls ?? []).map(...)`
- `(product.featureBullets ?? []).filter(Boolean)` — also filters out empty strings in the array

Added a "No image available" fallback when the image URL is missing, and a "Data not available" message for all text fields.

---

#### FUNC-6: Duplicate React key warning for image thumbnails

**Problem:** Some products have duplicate image URLs in their `imageUrls` array (same URL appears twice). Using the URL as the React `key` produced duplicate key warnings and could cause rendering inconsistencies.

**Fix:** Changed to a composite key: ``key={`${idx}-${url}`}`` — the index is always unique within the array, so this eliminates duplicates while keeping the URL in the key for readability.

---

### Security Vulnerabilities

#### SEC-1: Full product object serialised into URL (data integrity risk)

**Problem:** Passing `?product=${JSON.stringify(product)}` in the URL allows anyone to craft a URL with arbitrary JSON: `?product={"title":"Fake Product","featureBullets":["..."]}`. The detail page rendered whatever arrived in the URL without any server-side validation. While React escapes text content by default (preventing XSS), this is a data integrity violation — a shared or bookmarked URL could display fabricated product data.

**Fix:** Same as FUNC-2 — pass `?sku=...` and fetch from the trusted API endpoint. The server only returns real products matched by SKU; a crafted SKU returns a 404, which the UI handles gracefully with a "Product not found" message.

---

#### SEC-2: API `limit` parameter could be bypassed

**Problem:** `parseInt(searchParams.get('limit')!)` returns `NaN` for non-numeric input. `NaN` propagated into the data layer where `filters?.limit || filtered.length` fell back to returning the entire dataset. An attacker could request `/api/products?limit=abc` to dump all products in a single response, bypassing the intended pagination limit.

**Fix:** Added explicit validation and clamping in `app/api/products/route.ts`:

```ts
limit: Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '') || 20)),
offset: Math.max(0, parseInt(searchParams.get('offset') ?? '') || 0),
```

This caps the limit to a maximum of 100 and defaults to 20 for invalid input.

---

#### SEC-3: Missing image hostname in Next.js allowlist

**Problem:** The `next.config.ts` `remotePatterns` only allowed `m.media-amazon.com`. Products with images hosted on `images-na.ssl-images-amazon.com` caused a runtime error: "Invalid src prop — hostname not configured under images.remotePatterns". This is also a security control — Next.js's image optimisation proxy should only serve from approved domains.

**Fix:** Added the second Amazon CDN hostname to `remotePatterns`:

```ts
{ protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' }
```

---

## Technical Approach

### React 18 state batching

The blank-grid bug (FUNC-3) was the subtlest issue. The root cause was that resetting `selectedSubCategory` in a `useEffect` (reactive) rather than in the event handler (imperative) meant it ran _after_ the products fetch had already triggered with stale state. Moving all resets into `handleCategoryChange` leveraged React 18's automatic batching: all `setState` calls within a single event handler are batched into one render, so the products `useEffect` always sees a consistent filter combination.

### `asChild` pattern for HTML validity

Both pages had `<button>` elements nested inside `<a>` tags — invalid HTML that browsers handle inconsistently and that triggered React's hydration mismatch errors. Fixed using Radix UI's `asChild` prop on shadcn's `Button` component. This causes `Button` to render as whatever its child element is (a `Link`/`<a>`), merging all styles, while avoiding the invalid nesting.

### Hydration warning suppression

Browser extensions (password managers, autofill tools) inject custom attributes like `fdprocessedid` into `<input>` and `<button>` elements. Because these mutations happen after server render but before React hydration, they cause hydration mismatch warnings in development. Added `suppressHydrationWarning` to the `<input>` in `components/ui/input.tsx` and the `<SelectPrimitive.Trigger>` in `components/ui/select.tsx` to silence these false positives without hiding real bugs.

### SKU-based navigation

Rather than serialising product data into URLs (fragile, tamper-prone, and incomplete), the application now uses SKU as the canonical product identifier. The detail page fetches fresh, complete data from the server on every load. This also means browser back/forward navigation and shared links always show current data.

---

## Enhancements

Beyond bug fixes, the following improvements were made to the overall quality of the application:

- **Typography system:** Inter + Plus Jakarta Sans replace the scaffold default. Headings use the display font with tight tracking (`letter-spacing: -0.025em`) for a polished, editorial feel. Body text uses Inter at 15px with comfortable `line-height: 1.6`.

- **Search UX:** The search input uses a "sunken" style (`bg-muted/50 border-transparent`) that activates visually on focus — a common pattern in modern search interfaces that reduces visual noise when the field is idle.

- **Product cards:** Rebuilt for pixel-accurate layout. The image is flush with the card top edge, the product title uses `line-clamp-2` to prevent cards from growing taller than their neighbours, and the "View Details" button is always pinned to the same vertical position across all cards in a row.

- **"Data not available" fallbacks:** Every field on the product detail page (title, SKU, category, subcategory, features, images) has a graceful fallback for missing data rather than rendering empty or crashing.

- **Accessible image thumbnails:** Thumbnail buttons on the product detail page include descriptive `aria-label` attributes ("View image 2 of 4") for screen reader users.
