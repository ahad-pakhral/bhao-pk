# Add a New Screen (Mobile or Webapp)

Guide for adding new screens/pages to the mobile app or webapp.

## Mobile (React Native / Expo)

### Step 1: Create the Screen

Create `mobile/src/screens/FeatureScreen.tsx`:

```tsx
import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SPACING } from '../theme';
import { Typography } from '../components';

export const FeatureScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="h2">Feature Title</Typography>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
});
```

### Step 2: Register in Navigation

Find the navigation config in `mobile/src/navigation/` and add:
```tsx
<Stack.Screen name="Feature" component={FeatureScreen} />
```

### Step 3: Export from screens index

In `mobile/src/screens/index.ts`, add the export.

## Webapp (Next.js)

### Step 1: Create the Page

Create `webapp/app/feature/page.tsx`:

```tsx
"use client";

import { useState } from "react";

export default function FeaturePage() {
  return (
    <div className="container">
      <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Feature Title</h2>
      {/* Content */}
    </div>
  );
}
```

### Step 2: Add to Navigation (if needed)

The webapp uses file-based routing. The URL `/feature` is automatic.

If it should appear in the navbar, update `webapp/app/layout.tsx` or the navigation component.

## Design Patterns

### Calling the Backend API

```tsx
// Webapp
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Mobile
const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

// Both: fetch with fallback
try {
  const res = await fetch(`${API_BASE}/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
  const result = await res.json();
  // Use result
} catch (err) {
  console.warn('Backend unavailable, using fallback');
  // Use dummy data
}
```

### Theme (Mobile)

```tsx
import { COLORS, SPACING } from '../theme';
// COLORS.background, COLORS.text, COLORS.primary, COLORS.surface, COLORS.border
// SPACING.xs, SPACING.sm, SPACING.md, SPACING.lg, SPACING.xl
```

### Theme (Webapp)

Uses CSS variables defined in globals.css:
```css
var(--bg-primary)      /* dark background */
var(--bg-surface)      /* card background */
var(--text-primary)    /* main text */
var(--text-secondary)  /* muted text */
var(--accent-primary)  /* brand color */
var(--accent-success)  /* green */
```
