# BHAO.PK Mobile App Documentation

## Overview
BHAO.PK is a price comparison engine for the Pakistani market. The mobile app is built using React Native and Expo, providing real-time price tracking, search, and comparison across multiple e-commerce platforms like Daraz, Telemart, and Shophive.

## Tech Stack
- **Framework**: React Native (Expo SDK 54)
- **Navigation**: React Navigation (Native Stack & Bottom Tabs)
- **Icons**: Lucide React Native
- **Fonts**: Archivo, JetBrains Mono (via Expo Google Fonts)
- **Styling**: React Native StyleSheet (Custom Theme)

## Project Structure
```
mobile/
├── App.tsx             # Entry point, font loading, navigation setup
├── src/
│   ├── components/     # Reusable core components (Typography, Button, Input, etc.)
│   ├── constants/      # Dummy data and app constants
│   ├── navigation/     # Navigation configuration
│   ├── screens/        # App screens (Home, Search, Product, etc.)
│   └── theme/          # Design system (Colors, Spacing, Fonts)
```

## 🎓 Layman's Viva Guide (How it's Coded)

If asked in a viva how this app is built, here is a simple explanation:

1.  **Framework**: We used **React Native with Expo**. This allows us to write code in JavaScript/TypeScript and have it run on both Android and iOS as a "Native" app. Expo provides the "SDK" (tools) to access phone features like the camera or storage easily.
2.  **Navigation**: We used **React Navigation**. We have a "Bottom Tab" navigator for the three main sections (Home, Search, Profile) and a "Stack" navigator to handle moving from a list of products to a specific "Product Detail" page.
3.  **Theming**: The app's look is controlled by a central `theme/index.ts` file. This is where we defined the **Hyper Lime** color and the **Archivo** fonts. Every component in the app imports from this theme, ensuring a consistent look.
4.  **Components**: We built the app using "Atomic Design." We created small, reusable pieces like a custom `Button` and `Input`. We then combined these to build larger pieces like `ProductCard`, and finally the full screens.
5.  **Data Ready**: The app uses a central `dummyData.ts` file. The data is structured in JSON format, which is the standard format used by real-world databases and web scrapers. This means we can swap the dummy data for real data from a server without changing the UI code.

## Build Instructions (APK)

### Local Build
1. Install dependencies: `npm install`
2. Start the development server: `npx expo start`

### Creating an APK (Production Build)
1. Install EAS CLI: `npm install -g eas-cli`
2. Log in to Expo: `eas login`
3. Build the Android APK:
   ```bash
   eas build -p android --profile preview
   ```
   *This will generate a direct download link for the .apk file.*

## Design System
- **Primary Color**: Hyper Lime (#CCFF00)
- **Background**: Deep Black (#000000)
- **Typography**: Headlines (Archivo Bold), Body (Archivo Regular), Prices (JetBrains Mono).
