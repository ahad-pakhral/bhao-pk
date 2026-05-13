import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Keyboard, ActivityIndicator } from 'react-native';
import { Search, Bell, X } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, ProductCard, Logo } from '../components';
import { useWishlist } from '../hooks/useWishlist';
import { apiClient } from '../services/api/client';
import { useAuth } from '../context/AuthContext';

export const HomeScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [trending, setTrending] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const normalizeProductCard = useCallback((p: any, idx: number) => {
    const priceNum =
      typeof p?.price === 'number'
        ? p.price
        : parseFloat(String(p?.price || '').replace(/[^0-9.]/g, '')) || 0;
    const url = p?.url || p?.productUrl || '';
    const store = p?.store || '';

    return {
      id: url || `scraped-${idx}`,
      url,
      name: p?.name || '',
      price: priceNum > 0 ? `Rs. ${Math.round(priceNum).toLocaleString()}` : 'Price unavailable',
      priceValue: priceNum,
      store,
      rating: typeof p?.rating === 'number' ? p.rating : 0,
      reviewsCount: typeof p?.reviewsCount === 'number' ? p.reviewsCount : 0,
      image: p?.imageUrl || p?.image || undefined,
      specs: p?.specs || '',
      inStock: p?.inStock !== false,
    };
  }, []);

  const fetchTrending = useCallback(async () => {
    setLoadingTrending(true);
    try {
      const data = await apiClient.get<any>('/search/trending');
      const results = Array.isArray(data?.results) ? data.results : [];
      setTrending(results.map(normalizeProductCard));
    } catch (e) {
      console.warn('[Home] Failed to load trending:', e);
      setTrending([]);
    } finally {
      setLoadingTrending(false);
    }
  }, [normalizeProductCard]);

  const fetchRecentlyViewed = useCallback(async () => {
    setLoadingRecent(true);
    try {
      if (!isAuthenticated) {
        setRecentlyViewed([]);
        return;
      }
      const data = await apiClient.get<any>('/recently-viewed?limit=10');
      const items = Array.isArray(data?.items) ? data.items : [];
      setRecentlyViewed(items.map((p: any, idx: number) => normalizeProductCard({
        ...p,
        url: p.productUrl,
        imageUrl: p.imageUrl,
      }, idx)));
    } catch (e) {
      console.warn('[Home] Failed to load recently viewed:', e);
      setRecentlyViewed([]);
    } finally {
      setLoadingRecent(false);
    }
  }, [isAuthenticated, normalizeProductCard]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [fetchRecentlyViewed]);

  // Backend suggestions (top results from /search) with a small debounce.
  useEffect(() => {
    if (!showSuggestions || !searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const keyword = searchQuery.trim();
    setLoadingSuggestions(true);
    const t = setTimeout(() => {
      apiClient
        .post<any>('/search', { keyword })
        .then((data) => {
          const results = Array.isArray(data?.results) ? data.results : [];
          setSuggestions(results.slice(0, 5).map(normalizeProductCard));
        })
        .catch((e) => {
          console.warn('[Home] Failed to load suggestions:', e);
          setSuggestions([]);
        })
        .finally(() => setLoadingSuggestions(false));
    }, 250);

    return () => clearTimeout(t);
  }, [searchQuery, showSuggestions, normalizeProductCard]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Keyboard.dismiss();
      setShowSuggestions(false);
      navigation.navigate('Search', { query: searchQuery });
    }
  };

  const handleSuggestionPress = (product: any) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigation.navigate('ProductDetail', { product });
  };

  const openProduct = useCallback((product: any) => {
    navigation.navigate('ProductDetail', { product });
  }, [navigation]);

  const renderProductCard = useCallback((product: any) => {
    const url = product?.url || '';
    const store = String(product?.store || '');
    const name = String(product?.name || '');
    const imageUrl = product?.image || product?.imageUrl || null;
    return (
      <ProductCard
        key={product.id}
        {...product}
        onPress={() => openProduct(product)}
        isWishlisted={!!url && isInWishlist(url)}
        onWishlistToggle={() => {
          if (!url || !store || !name) return;
          toggleWishlist({ url, store, name, imageUrl });
        }}
      />
    );
  }, [isInWishlist, openProduct, toggleWishlist]);

  const showSuggestionsDropdown = showSuggestions && (loadingSuggestions || suggestions.length > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Logo size="md" showText={true} />
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
          <Bell color={COLORS.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.searchSection}>
          <Typography variant="h1" style={styles.welcomeText}>
            Find the <Typography variant="h1" color={COLORS.primary}>Best Prices</Typography> in Pakistan
          </Typography>
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Search color={COLORS.textSecondary} size={20} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setShowSuggestions(text.trim().length > 0);
                }}
                onSubmitEditing={handleSearch}
                placeholder="Search products..."
                placeholderTextColor={COLORS.textSecondary}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                  <X color={COLORS.textSecondary} size={20} />
                </TouchableOpacity>
              )}
            </View>
            {showSuggestionsDropdown && (
              <View style={styles.suggestionsDropdown}>
                {loadingSuggestions && (
                  <View style={styles.suggestionLoadingRow}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                    <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: SPACING.sm }}>
                      Searching...
                    </Typography>
                  </View>
                )}
                {suggestions.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestionPress(product)}
                  >
                    <Search color={COLORS.textSecondary} size={16} />
                    <View style={styles.suggestionText}>
                      <Typography variant="body" numberOfLines={1}>{product.name}</Typography>
                      <Typography variant="caption" color={COLORS.textSecondary} numberOfLines={1}>
                        {product.store} • {product.price}
                      </Typography>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
            TRENDING NOW
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {loadingTrending ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: SPACING.sm }}>
                  Loading trending...
                </Typography>
              </View>
            ) : (
              trending.map((product) => (
                <View key={product.id} style={styles.trendingItem}>
                  {renderProductCard(product)}
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
            RECENTLY VIEWED
          </Typography>
          {!isAuthenticated ? (
            <Typography variant="caption" color={COLORS.textSecondary}>
              Login to see your recently viewed products.
            </Typography>
          ) : loadingRecent ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Typography variant="caption" color={COLORS.textSecondary} style={{ marginLeft: SPACING.sm }}>
                Loading recently viewed...
              </Typography>
            </View>
          ) : recentlyViewed.length === 0 ? (
            <Typography variant="caption" color={COLORS.textSecondary}>
              No recently viewed products yet.
            </Typography>
          ) : (
            recentlyViewed.map(renderProductCard)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 18,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  welcomeText: {
    marginBottom: SPACING.lg,
  },
  searchBarWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  horizontalScroll: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  trendingItem: {
    width: 280,
    marginRight: SPACING.md,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
});
