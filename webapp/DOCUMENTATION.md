# BHAO.PK Web Application Documentation

## Project Overview
BHAO.PK is an intelligent price comparison engine designed to help users track prices, compare deals, and save money across various e-commerce platforms in Pakistan.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Vanilla CSS (CSS Variables for Design System)
- **Icons**: Emoji-based and SVG icons
- **Fonts**: Archivo (Display) and JetBrains Mono (Data/Monospace)

## Design System
The application follows a "Cosmic Terminal" aesthetic:
- **Core Background**: Deep black (`#020202`) with a cosmic gradient and starfield.
- **Primary Accent**: Hyper Lime (`#CCFF00`)
- **Secondary Accent**: Deep Iris (`#5D3FD3`)
- **Alert Accent**: Radical Red (`#FF3366`)
- **Success Accent**: Spring Green (`#00FF88`)

## Pages Implemented
1. **Home (`/`)**: Hero section with search, trending products, and personalized recommendations.
2. **Search Results (`/search`)**: Filterable and sortable list of products from multiple stores.
3. **Product Detail (`/product/[id]`)**: Comprehensive product info, specifications, price history chart, and user reviews.
4. **User Profile (`/profile`)**: Wishlist management and price alert tracking.
5. **Login/Signup (`/login`, `/signup`)**: User authentication interfaces.
6. **Admin Login (`/admin/login`)**: Secure access for system administrators.
7. **Admin Dashboard (`/admin/dashboard`)**: System health monitoring and platform activity logs.

## 🎓 Layman's Viva Guide (How it's Coded)

If asked in a viva how this is built, here is a simple explanation:

1.  **Architecture**: We used **Next.js 14**, which is a modern web framework. It uses "File-based Routing," meaning every folder inside the `app/` directory automatically becomes a page on the website (e.g., `app/search` becomes `bhao.pk/search`).
2.  **Design System**: Instead of hard-coding colors, we used **CSS Variables** defined in `globals.css`. This makes it easy to change the "theme" of the entire site in one place. The "Cosmic" background is created using a fixed background with CSS gradients and blur filters.
3.  **Data Management**: The app uses **TypeScript Interfaces** to define what a "Product" looks like. This ensures that the frontend is ready to plug into a real database (like MongoDB or PostgreSQL) later. We currently use a central "Dummy Data" file to mimic real API responses.
4.  **State Management**: We use **React Hooks** like `useState` to handle search inputs, filters, and notifications (toasts). For example, when you type in the search bar, the state updates live.
5.  **Responsiveness**: We used **CSS Flexbox and Grid** for layouts. This allows the website to automatically re-arrange itself whether it's viewed on a large monitor or a small tablet.

## Getting Started
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Build for production: `npm run build`
