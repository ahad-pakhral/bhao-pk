# Bhao.pk: Requirement-to-Test Mapping Guide

This document provides a comprehensive mapping of all **27 Functional Requirements (FR)** to specific testing procedures. Use this guide to verify the 100% implementation status of the Bhao.pk platform during defense preparation or quality assurance.

---

## 1. Search & Discovery

| ID | Functional Requirement | Testing Procedure | Expected Result |
|:---|:---|:---|:---|
| **FR-1** | View product listings from multiple platforms | Perform a search for "Samsung S24" on the homepage. | Results appear with store badges (Daraz, Telemart, Shophive). |
| **FR-6** | Search for a product using keywords | Enter "iPhone" in the search bar and press enter. | The system redirects to the search results page with matching items. |
| **FR-7** | View aggregated search results | Scroll through search results. | Products from all three stores are intermingled in a single list/grid. |
| **FR-2** | View “Trending Products” on homepage | Scroll down on the homepage. | A section labeled "Trending" shows popular products with live prices. |
| **FR-3** | View real-time search suggestions | Type "air" slowly into the search bar. | A dropdown appears with suggestions like "AirPods", "Air Purifier", etc. |
| **FR-4** | View recently viewed products | Click on 3 different products, then go back to the homepage. | A "Recently Viewed" section appears showing those exact 3 items. |
| **FR-5** | Unified multi-vendor product page | Open a specific flagship phone (e.g., iPhone 16) detail page. | A "Compare Prices" section shows the same phone's price on other stores. |

---

## 2. Filtering & Sorting

| ID | Functional Requirement | Testing Procedure | Expected Result |
|:---|:---|:---|:---|
| **FR-8** | Sort search results by Price (Low to High) | Perform a search, then click the "Sort" dropdown and select "Price: Low to High". | The list reorders with the cheapest items at the top. |
| **FR-9** | Filter results by Store | In the search filters, uncheck "Telemart" and "Shophive". | Only products from "Daraz" remain visible in the results. |
| **FR-10** | Filter results by Price Range | Enter "50000" in Min and "100000" in Max price filters. | Only products within that range (Rs. 50k - 100k) are displayed. |

---

## 3. Product Experience

| ID | Functional Requirement | Testing Procedure | Expected Result |
|:---|:---|:---|:---|
| **FR-11** | View detailed product information | Click on any product card from the search results. | A dedicated page opens showing full specs, description, and images. |
| **FR-12** | “Open in Vendor Site” navigation | Click the "View on Store" button on any product detail page. | The browser opens the original product page on the vendor's website. |
| **FR-20** | View graphical history of price changes | Look at the "Price History" section on a product detail page. | An interactive SVG chart shows price fluctuations over the last few days/weeks. |
| **FR-23** | View updated prices at intervals | Check a product today, then check again after 4 hours. | If the store price changed, the Bhao.pk price will update (due to 1h cache TTL). |
| **FR-26** | Automatically assigned “Best Value” badges | Open a product comparison view with multiple vendors. | The vendor with the lowest price has a "BEST VALUE" badge attached. |

---

## 4. User Accounts & Security

| ID | Functional Requirement | Testing Procedure | Expected Result |
|:---|:---|:---|:---|
| **FR-13** | Create a new account (Sign up) | Go to Signup page, enter name, email, and a strong password. | User is redirected to login or home; confirmation toast appears. |
| **FR-14** | Log into the system | Enter valid credentials on the Login page. | User is authenticated; profile name appears in the header. |
| **FR-15** | Log out | Click on the Profile icon/name and select "Logout". | User session is cleared; redirected to login/home as a guest. |
| **FR-16** | Recover forgotten password | Click "Forgot Password", enter email, and check inbox. | An email from Supabase arrives with a secure reset link. |

---

## 5. Personalization & Alerts

| ID | Functional Requirement | Testing Procedure | Expected Result |
|:---|:---|:---|:---|
| **FR-17** | Set a target price alert | On a product page, enter a price lower than current and click "Set Alert". | Alert is saved; visible in the "Alerts" management screen. |
| **FR-18** | Receive email notification for price drops | (Simulated) Price in DB drops below user's target. | User receives a beautifully formatted email via Resend API. |
| **FR-19** | Receive push notification for price drops | (Mobile) Same as FR-18. | A native push notification appears on the mobile device. |
| **FR-21** | Add products to “Wishlist” | Click the heart icon on any product card. | Heart turns red; product appears in the "Wishlist" screen. |
| **FR-22** | Remove items from “Wishlist” | Click the heart icon again or click "Remove" in Wishlist screen. | Product disappears from the wishlist; confirmation toast appears. |
| **FR-27** | Personalized recommendations | Search for "Laptops", browse 2-3 items, then check the homepage. | "Recommended for You" section shows laptop-related deals. |

---

## 6. Administration

| ID | Functional Requirement | Testing Procedure | Expected Result |
|:---|:---|:---|:---|
| **FR-24** | Admin logs into backend dashboard | Navigate to `/admin/login` and enter admin credentials. | Admin dashboard opens showing system health and metrics. |
| **FR-25** | Admin views stats (Scraped + Users) | View the charts/cards on the Admin Dashboard. | Real-time counts for "Total Users", "Active Alerts", and "Total Scraped" are visible. |

---

## Summary of Success Criteria
*   **Data Integrity:** All data must be live (scraped from stores or pulled from Supabase).
*   **Sync:** Adding a wishlist item on the Webapp must show it on the Mobile app (Cloud Sync).
*   **Performance:** Search results must return within 3-5 seconds (Redis cache verification).
*   **Security:** Unauthorized users must be blocked from accessing the Admin Dashboard.
