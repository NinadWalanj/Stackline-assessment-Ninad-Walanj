# StackShop Bug Fix and Enhancement Report

## Overview

This document outlines the bugs I found during my code review, the steps I took to fix them, the engineering reasoning behind my approach, and a few UI enhancements I added to improve the overall experience.

## Identified Bugs and Fixes

### UX Issues

- **UX 1 Inaccurate Product Count**
  - **Problem:** The UI hardcoded "Showing 20 products" regardless of the actual database total.
  - **Fix:** I pulled the total count from the API response to dynamically display accurate text, such as "Showing 1 to 20 of 150 products".
  - **Reasoning:** Users need accurate context regarding the size of their search results to navigate effectively. Hardcoded numbers create a poor experience.

- **UX 2 Category Selection Issue**
  - **Problem:** The category dropdown lacked an "All Categories" option. Once selected, users could only reset it by clicking "Clear Filters", which wiped their active search query as well.
  - **Fix:** I added an "All Categories" option to the list.
  - **Reasoning:** Treating this specific selection as an undefined value in the code decouples the category and search controls, allowing users to broaden their search without losing their typed input.

- **UX 3 Infinite Loading Spinner**
  - **Problem:** Network failures left the page hanging on "Loading products" forever since the fetch promises lacked a catch block.
  - **Fix:** I added error handling to all network calls.
  - **Reasoning:** A hanging loading state traps the user. Resolving the promise safely ensures the UI can transition to an empty state or display a helpful error message instead of freezing.

### Design Problems

- **Design 1 Broken Product Card Layout**
  - **Problem:** Default padding created awkward gaps, multi-line titles broke the layout, and the view details button floated randomly depending on text length.
  - **Fix:** I rebuilt the card structure using flexbox, removed default padding to make the image flush with the top, clipped the corners, and pinned the button to the bottom using auto-margins.
  - **Reasoning:** Using flexbox with auto margins is the most robust way to ensure uniform grid layouts.

- **Design 2 Excessive Whitespace**
  - **Problem:** Stacked padding classes on the product detail page created massive gaps above the features list.
  - **Fix:** I stripped out the redundant padding classes to let the standard container spacing handle the layout.
  - **Reasoning:** Relying on standard container padding prevents compounding whitespace issues and keeps the code much cleaner.

- **Design 3 Misaligned Search Icon**
  - **Problem:** The search magnifying glass used a fixed top pixel offset, making it uncentered on varying screen sizes.
  - **Fix:** I switched to absolute vertical centering using percentages and translation.
  - **Reasoning:** Fixed pixel offsets are brittle in responsive design. Percentage-based translation ensures perfect centering across all devices.

### Functionality Bugs

- **Functionality 1 Broken Subcategory Filter**
  - **Problem:** The API supported category filtering, but the frontend forgot to pass the parameter. The dropdown showed every subcategory in the database at once.
  - **Fix:** I appended the selected category query parameter to the fetch URL.
  - **Reasoning:** Filtering at the network level prevents downloading unnecessary data and fixes the broken user flow.

- **Functionality 2 Detail Page Crashes**
  - **Problem:** The homepage tried passing the entire product object through the URL. Missing fields caused runtime crashes.
  - **Fix:** I changed the routing to pass only the SKU. The detail page now fetches fresh product data directly from the server using that SKU.
  - **Reasoning:** URLs have length limits and are easily tampered with. Passing a unique identifier guarantees data integrity and prevents crashes.

- **Functionality 3 Blank Grid on Category Switch**
  - **Problem:** Clicking a new category did not clear the old subcategory state, resulting in a query for a mismatched combination and returning zero products.
  - **Fix:** I grouped all state resets inside the category change event handler.
  - **Reasoning:** Moving resets out of reactive hooks and into the event handler leverages React state batching, ensuring the fetch only runs once with a valid combination of filters.

- **Functionality 4 Missing Pagination**
  - **Problem:** The database had thousands of items, but users could only see the first twenty.
  - **Fix:** I built a pagination system with a page state, calculating offsets, and added Next and Previous buttons.
  - **Reasoning:** Simple pagination is the most time efficient way to unlock the remaining catalog within the assignment constraints, avoiding the complexity of an infinite scroll while restoring full functionality.

- **Functionality 5 Undefined Property Crashes**
  - **Problem:** Missing images or feature text caused fatal application errors.
  - **Fix:** I implemented optional chaining and nullish coalescing.
  - **Reasoning:** Defensive programming is essential when dealing with external APIs. Optional chaining safely prevents the entire React tree from crashing when a single property is missing.

- **Functionality 6 Duplicate React Keys**
  - **Problem:** Identical image URLs in the same array triggered console warnings and potential rendering bugs.
  - **Fix:** I created composite keys using both the array index and the URL.
  - **Reasoning:** React relies on unique keys to optimize rendering.

### Security Vulnerabilities

- **Security 1 URL Injection Risk**
  - **Problem:** Passing raw JSON data in the URL allowed anyone to modify the product details rendered on the screen.
  - **Fix:** Relying purely on the SKU forces the application to render only trusted data straight from the backend API.
  - **Reasoning:** Client side data should never be trusted. Forcing a server fetch prevents malicious actors from sharing manipulated links.

- **Security 2 API Limit Bypass**
  - **Problem:** Passing non-numeric strings to the limit parameter bypassed the pagination math, allowing malicious users to dump the entire database in one request.
  - **Fix:** I added strict server side validation, capping the maximum return size to one hundred and defaulting to twenty for invalid inputs.
  - **Reasoning:** Never trust client inputs. Enforcing strict limits on the backend protects the database from denial of service attacks or data scraping.

## Enhancements

Beyond strictly fixing broken code, I implemented several improvements to elevate the application:

- **Modern Typography:** Replaced the generic default font with Inter and Plus Jakarta Sans to give the application a deliberate brand identity and better visual hierarchy.
- **Search Interface Polish:** Added a visual focus state to the search bar so it highlights when active, improving the overall accessibility and feel of the input.
- **Graceful Fallbacks:** Added fallback text across the application so the interface degrades gracefully when database fields are empty, rather than rendering blank spaces or throwing errors.
