// Mock data service - returns simulated API responses

import {
  LoginResponse,
  SignupResponse,
  SearchResponse,
  ProductDetailResponse,
  PriceHistoryResponse,
  AlertsResponse,
  WishlistResponse,
  ForgotPasswordResponse,
} from '../../types/api';
import { TRENDING_PRODUCTS, SEARCH_RESULTS, RECENTLY_VIEWED } from '../../constants/dummyData';
import { ProductWithListings, Alert, WishlistItem, PriceHistory } from '../../types/models';

class MockDataService {
  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getData<T>(endpoint: string, options?: RequestInit): Promise<T> {
    await this.delay(); // Simulate network delay

    const method = options?.method || 'GET';
    const body = options?.body ? JSON.parse(options.body as string) : null;

    // Route based on endpoint and method
    if (endpoint.includes('/auth/login')) {
      return this.mockLogin(body) as T;
    }
    if (endpoint.includes('/auth/signup')) {
      return this.mockSignup(body) as T;
    }
    if (endpoint.includes('/auth/forgot-password')) {
      return this.mockForgotPassword(body) as T;
    }
    if (endpoint.includes('/products/search')) {
      return this.mockSearch(endpoint) as T;
    }
    if (endpoint.includes('/products/') && endpoint.includes('/price-history')) {
      const productId = endpoint.split('/')[2];
      return this.mockPriceHistory(productId) as T;
    }
    if (endpoint.match(/\/products\/[^/]+$/)) {
      const productId = endpoint.split('/').pop();
      return this.mockProductDetail(productId!) as T;
    }
    if (endpoint.includes('/products/trending')) {
      return this.mockTrending() as T;
    }
    if (endpoint.includes('/wishlist') && method === 'GET') {
      return this.mockGetWishlist() as T;
    }
    if (endpoint.includes('/wishlist') && method === 'POST') {
      return this.mockAddToWishlist(body) as T;
    }
    if (endpoint.includes('/wishlist/') && method === 'DELETE') {
      return { success: true, message: 'Removed from wishlist' } as T;
    }
    if (endpoint.includes('/alerts') && method === 'GET') {
      return this.mockGetAlerts() as T;
    }
    if (endpoint.includes('/alerts') && method === 'POST') {
      return this.mockCreateAlert(body) as T;
    }
    if (endpoint.includes('/alerts/') && method === 'DELETE') {
      return { success: true, message: 'Alert deleted' } as T;
    }

    throw new Error(`Mock data not implemented for: ${method} ${endpoint}`);
  }

  private mockLogin(body: any): LoginResponse {
    return {
      user: {
        id: '1',
        email: body.email || 'demo@bhao.pk',
        name: 'Demo User',
        createdAt: new Date(),
      },
      token: 'mock-jwt-token-12345',
    };
  }

  private mockSignup(body: any): SignupResponse {
    return {
      user: {
        id: '2',
        email: body.email,
        name: body.name,
        createdAt: new Date(),
      },
      token: 'mock-jwt-token-67890',
    };
  }

  private mockForgotPassword(body: any): ForgotPasswordResponse {
    return {
      message: `Password reset link sent to ${body.email}`,
    };
  }

  private mockSearch(endpoint: string): SearchResponse {
    // Extract query parameters
    const url = new URL(`http://dummy.com${endpoint}`);
    const query = url.searchParams.get('query') || '';

    // Filter results based on query
    let results = [...SEARCH_RESULTS];
    if (query) {
      results = results.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.specs?.toLowerCase().includes(query.toLowerCase())
      );
    }

    return {
      results: results as ProductWithListings[],
      total: results.length,
      page: 1,
      totalPages: 1,
      hasMore: false,
    };
  }

  private mockProductDetail(productId: string): ProductDetailResponse {
    const product = [...TRENDING_PRODUCTS, ...SEARCH_RESULTS, ...RECENTLY_VIEWED].find(
      p => p.id === productId
    );

    if (!product) {
      throw new Error('Product not found');
    }

    return {
      ...product,
      description: `High-quality ${product.name} with excellent features and performance. Best price in Pakistan guaranteed.`,
      category: 'Electronics',
      specifications: {
        Brand: product.store || 'N/A',
        Model: product.name,
        Condition: 'Brand New',
        Warranty: '1 Year Official',
      },
      listings: [
        {
          id: '1',
          productId: product.id,
          storeId: '1',
          price: parseFloat(product.price.replace(/[^0-9.]/g, '')),
          currency: 'PKR',
          url: 'https://daraz.pk',
          inStock: true,
          lastUpdated: new Date(),
          store: {
            id: '1',
            name: product.store || 'Daraz',
            url: 'https://daraz.pk',
            isActive: true,
          },
        },
      ],
      lowestPrice: parseFloat(product.price.replace(/[^0-9.]/g, '')),
      highestPrice: parseFloat(product.price.replace(/[^0-9.]/g, '')) * 1.1,
      averageRating: product.rating || 4.5,
      reviewCount: 127,
      reviews: [
        {
          id: '1',
          userId: '1',
          userName: 'Ahad Ali',
          rating: 5,
          comment: 'Excellent product! Highly recommended.',
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          userId: '2',
          userName: 'Sarah Khan',
          rating: 4,
          comment: 'Good value for money. Fast delivery.',
          createdAt: new Date('2024-01-10'),
        },
      ],
    } as ProductDetailResponse;
  }

  private mockTrending(): ProductWithListings[] {
    return TRENDING_PRODUCTS as ProductWithListings[];
  }

  private mockPriceHistory(productId: string): PriceHistoryResponse {
    // Generate 30 days of mock price history
    const basePrice = 300000;
    const history: PriceHistory[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = Math.sin(i / 5) * 10000 + (Math.random() - 0.5) * 5000;
      history.push({
        id: `hist-${i}`,
        storeListingId: '1',
        price: basePrice + variation,
        timestamp: date,
      });
    }

    const prices = history.map(h => h.price);
    return {
      history,
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
    };
  }

  private mockGetWishlist(): WishlistResponse {
    return {
      items: [],
    };
  }

  private mockAddToWishlist(body: any): WishlistItem {
    return {
      id: `wish-${Date.now()}`,
      userId: '1',
      productId: body.productId,
      addedAt: new Date(),
    };
  }

  private mockGetAlerts(): AlertsResponse {
    return {
      alerts: [],
    };
  }

  private mockCreateAlert(body: any): Alert {
    return {
      id: `alert-${Date.now()}`,
      userId: '1',
      productId: body.productId,
      productName: 'Product Name',
      productImage: 'https://via.placeholder.com/400',
      currentPrice: 300000,
      targetPrice: body.targetPrice,
      store: 'Daraz',
      isActive: true,
      createdAt: new Date(),
    };
  }
}

export const mockDataService = new MockDataService();
