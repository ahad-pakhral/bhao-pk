import { rankProducts } from './test-ranking-temp';

const dummyData = [
  {
    name: 'Oraimo Watch 6 Pro (OSW-807S)',
    price: 7399,
    originalPrice: 7399,
    url: 'test1',
    imageUrl: 'test1',
    rating: 0,
    reviewsCount: 0,
    store: 'Shophive',
    inStock: true
  },
  {
    name: 'Google Pixel 6 Pro - 256GB, 12GB RAM, 6.7" Display',
    price: 101478,
    originalPrice: 135999,
    url: 'test2',
    imageUrl: 'test2',
    rating: 5,
    reviewsCount: 1,
    store: 'Daraz',
    inStock: true
  },
  {
    name: 'Google Pixel 6 pro | official PTA approved | 12GB Ram',
    price: 86999,
    originalPrice: 95000,
    url: 'test3',
    imageUrl: 'test3',
    rating: 0,
    reviewsCount: 0,
    store: 'Daraz',
    inStock: true
  }
];

const ranked = rankProducts(dummyData, 'google pixel 6 pro');
console.log("\nFINAL SORTING:");
ranked.forEach(r => console.log(`[${r._score.toFixed(4)}] ${r.name}`));
