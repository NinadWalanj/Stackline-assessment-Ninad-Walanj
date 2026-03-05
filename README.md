# StackShop Bug Fix and Enhancement Report

## Overview

This document outlines the bugs I found during my code review, the steps I took to fix them, the engineering reasoning behind my approach, and a few UI enhancements I added to improve the overall experience.

## Identified Bugs and Fixes

### UX Issues

- **UX 1 Category Selection Trap:** The category dropdown lacked an "All Categories" option. Once selected, users could only reset it by clicking "Clear Filters", which frustratingly wiped their active search query as well. I fixed this by adding an "All Categories" option to the list. By treating this specific selection as an undefined value in the code, the category and search controls are now independent.
- **UX 2 Infinite Loading Spinner:** Network failures left the page hanging on "Loading products" forever since the fetch promises lacked a catch block. I added error handling to all network calls to ensure the loading state resolves properly, showing an empty state instead of freezing the application.
- **UX 3 Inaccurate Product Count:** The UI hardcoded "Showing 20 products" regardless of the actual database total. I pulled the total count from the API response to dynamically display accurate text, such as "Showing 1 to 20 of 150 products", giving users proper context.
- **UX 4 Default Next.js Title:** The browser tab still displayed "Create Next App". I updated the application layout metadata with the proper StackShop title and description.

### Design Problems

- **Design 1 Generic Typography:** The app used the default scaffolding font, lacking brand identity or visual hierarchy. I brought in Inter for clean body text and Plus Jakarta Sans for modern headings. Note: I also fixed a self referencing CSS variable bug in the original code that previously broke the display font.
- **Design 2 Misaligned Search Icon:** The search magnifying glass used a fixed top pixel offset, making it uncentered on varying screen sizes. I switched to absolute vertical centering using percentages and translation. I also added a focus state so the input visually highlights when clicked.
- **Design 3 Broken Product Card Layout:** Default padding created awkward gaps, multi line titles broke the layout, and the view details button floated randomly depending on text length. I rebuilt the card structure using flexbox. I removed default padding to make the image flush with the top, clipped the corners, and pinned the button to the bottom using auto margins so the grid looks perfectly uniform.
- **Design 4 Excessive Whitespace:** Stacked padding classes on the product detail page created massive gaps above the features list. I stripped out the redundant padding classes to let the standard container spacing handle the layout.

### Functionality Bugs

- **Functionality 1 Broken Subcategory Filter:** The API supported category filtering, but the frontend forgot to pass the parameter. The dropdown showed every subcategory in the database at once. I appended the selected category query parameter to the fetch URL to fix this.
- **Functionality 2 Detail Page Crashes:** The homepage tried passing the entire product object through the URL. Missing fields caused runtime crashes. I changed the routing to pass only the SKU. The detail page now fetches fresh product data directly from the server using that SKU.
- **Functionality 3 Blank Grid on Category Switch:** Clicking a new category did not clear the old subcategory state, resulting in a query for a mismatched combination and returning zero products. I grouped all state resets inside the category change event handler. React batches these updates synchronously, ensuring the fetch only runs with valid filters.
- **Functionality 4 Missing Pagination:** The database had thousands of items, but users could only see the first twenty. I built a pagination system with a page state, calculating offsets mathematically. I added Next and Previous buttons that disable at the data boundaries.
- **Functionality 5 Undefined Property Crashes:** Missing images or feature text caused fatal application errors. I implemented optional chaining and nullish coalescing across the board. I also added graceful fallback text like "No image available" for incomplete data entries.
- **Functionality 6 Duplicate React Keys:** Identical image URLs in the same array triggered console warnings and potential rendering bugs. I created composite keys using both the array index and the URL to guarantee uniqueness.

### Security Vulnerabilities

- **Security 1 URL Injection Risk:** Passing raw JSON data in the URL allowed anyone to modify the product details rendered on the screen. Relying purely on the SKU forces the application to render only trusted data straight from the backend API.
- **Security 2 API Limit Bypass:** Passing non numeric strings to the limit parameter bypassed the pagination math, allowing malicious users to dump the entire database in one request. I added strict server side validation, capping the maximum return size to one hundred and defaulting to twenty for invalid inputs.
- **Security 3 Unconfigured Image Hosts:** The Next.js config only allowed one Amazon domain. Images from alternative Amazon Content Delivery Networks threw errors. I added the secondary domain to the allowed remote patterns list to ensure the image proxy works safely.

## Technical Approach

### React State Batching

The blank grid issue required understanding how React handles state. By moving state resets out of reactive hooks and into imperative event handlers, I ensured the data fetch always sees the correct filter combination.

### Valid HTML Nesting

I replaced invalid nested anchor and button tags using the "asChild" pattern. This merges styles correctly while keeping the Document Object Model valid and preventing hydration errors.

### Hydration Mismatch Fixes

I suppressed warnings caused by browser extensions injecting custom attributes into form fields, cleaning up the development console.

### SKU Based Navigation

Shifting from URL serialized data to SKU based routing makes the app significantly more robust, allowing for safe link sharing and preventing client side data tampering.
