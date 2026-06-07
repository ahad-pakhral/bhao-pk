import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Modal, Keyboard, ActivityIndicator } from 'react-native';
import { ArrowLeft, SlidersHorizontal, ChevronDown, X, Search as SearchIcon } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, ProductCard } from '../components';
import { useSearch } from '../hooks/useSearch';
import type { ProductCardData, ProductWithListings } from '../types/models';
import { apiClient } from '../services/api/client';

/** Convert backend scraped product into ProductCardData format */
function normalizeProduct(p: any, idx: number): ProductCardData {
  const price = typeof p.price === 'number' ? p.price : parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
  return {
    id: p.id || `scraped-${idx}`,
    name: p.name || '',
    specs: p.store || '',
    price: `Rs. ${price.toLocaleString()}`,
    rating: p.rating || 0,
    reviews: p.reviewsCount || 0,
    reviewsCount: p.reviewsCount || 0,
    priceValue: price,
    image: p.imageUrl || undefined,
    store: p.store || 'Unknown',
    inStock: p.inStock !== false,
    brand: p.brand || 'Unknown',
    isOutlier: p.isOutlier === true,
  } as ProductCardData;
}

export const SearchScreen = ({ route, navigation }: any) => {
  const { query } = route.params || {};
  const [searchQuery, setSearchQuery] = useState(query || '');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(!query);
  const [hasSearched, setHasSearched] = useState(!!query);
  const [liveProducts, setLiveProducts] = useState<ProductCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [interpretedQuery, setInterpretedQuery] = useState<string | null>(null);

  // Collect unique brands dynamically from active search results
  const availableBrands = React.useMemo(() => {
    const brandSet = new Set<string>();
    liveProducts.forEach(p => {
      const b = (p as any).brand;
      if (b && b !== 'Unknown' && b !== 'Generic' && b !== 'Other') {
        brandSet.add(b);
      }
    });
    return Array.from(brandSet).sort();
  }, [liveProducts]);

  // Enforce real products from API
  const productsSource = liveProducts as unknown as ProductWithListings[];

  const {
    filteredProducts,
    filters,
    sortBy,
    updateFilters,
    updateSort,
    clearFilters,
  } = useSearch(productsSource, searchQuery);

  // Fetch from backend API
  const fetchFromAPI = useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;
    setIsLoading(true);
    try {
      const data = await apiClient.post<any>('/search', { keyword });
      const normalized = (data.results || []).map(normalizeProduct);
      setLiveProducts(normalized);
      const hasInterpreted = data.interpretedQuery && data.interpretedQuery.toLowerCase() !== keyword.toLowerCase();
      setInterpretedQuery(hasInterpreted ? data.interpretedQuery : null);
    } catch (err) {
      console.warn('[Search] Backend unavailable:', err);
      setLiveProducts([]);
      setInterpretedQuery(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (route?.params?.query) {
      setSearchQuery(route.params.query);
      setHasSearched(true);
      setShowSuggestions(false);
      fetchFromAPI(route.params.query);
    }
  }, [route?.params?.query, fetchFromAPI]);

  // Real-time product suggestions disabled without dummy data or distinct backend endpoint
  const suggestions: any[] = [];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Keyboard.dismiss();
      setShowSuggestions(false);
      setHasSearched(true);
      fetchFromAPI(searchQuery);
    }
  };

  const handleSuggestionPress = (product: any) => {
    setShowSuggestions(false);
    Keyboard.dismiss();
    navigation.navigate('ProductDetail', { product });
  };

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Rating: High to Low' },
  ];

  const stores = ['Daraz', 'Telemart', 'Shophive'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setShowSuggestions(text.trim().length > 0 && !hasSearched);
            }}
            onSubmitEditing={handleSearch}
            placeholder="Search products..."
            placeholderTextColor={COLORS.textSecondary}
            autoFocus
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setHasSearched(false);
                setShowSuggestions(false);
                setInterpretedQuery(null);
              }}
              style={styles.clearSearchButton}
            >
              <X color={COLORS.textSecondary} size={20} />
            </TouchableOpacity>
          )}
        </View>
        {hasSearched && (
          <TouchableOpacity style={styles.sortButton} onPress={() => setShowSort(true)}>
            <Typography variant="bodySmall" color={COLORS.text}>Sort</Typography>
            <ChevronDown color={COLORS.text} size={16} />
          </TouchableOpacity>
        )}
      </View>

      {!hasSearched && showSuggestions && suggestions.length > 0 ? (
        <ScrollView contentContainerStyle={styles.suggestionsContainer}>
          <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.suggestionsTitle}>
            SUGGESTIONS
          </Typography>
          {suggestions.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(product)}
            >
              <SearchIcon color={COLORS.textSecondary} size={20} />
              <View style={styles.suggestionText}>
                <Typography variant="body" numberOfLines={1}>{product.name}</Typography>
                <Typography variant="caption" color={COLORS.textSecondary} numberOfLines={1}>
                  {product.store} • {product.price}
                </Typography>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : !hasSearched ? (
        <View style={styles.emptySearchState}>
          <SearchIcon color={COLORS.textSecondary} size={64} strokeWidth={1} />
          <Typography variant="h3" style={styles.emptyTitle}>Search for products</Typography>
          <Typography color={COLORS.textSecondary} style={styles.emptyText}>
            Start typing to find the best prices in Pakistan
          </Typography>
        </View>
      ) : (
        <>
          <View style={styles.filterBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant="monoBold" color={COLORS.textSecondary}>
                {filteredProducts.length} RESULTS
              </Typography>
              {isLoading && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 8 }} />}
            </View>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
              <SlidersHorizontal color={COLORS.background} size={16} />
              <Typography variant="bodySmall" color={COLORS.background} style={styles.filterText}>
                FILTERS
              </Typography>
            </TouchableOpacity>
          </View>

          {interpretedQuery && (
            <View style={styles.aiBanner}>
              <Typography variant="bodySmall" color={COLORS.primary} style={{ fontWeight: 'bold', marginRight: 4 }}>
                ✨ AI Search:
              </Typography>
              <Typography variant="bodySmall" color={COLORS.text} style={{ flex: 1 }}>
                Showing results for "{interpretedQuery}" (interpreted from "{query || searchQuery}")
              </Typography>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.resultsList}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...(product as any)}
                price={(product as any).price || ""}
                onPress={() => navigation.navigate('ProductDetail', { product })}
              />
            ))}

            {filteredProducts.length === 0 && isLoading && (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Typography color={COLORS.textSecondary} style={styles.emptyText}>
                  Searching for products...
                </Typography>
              </View>
            )}
            {filteredProducts.length === 0 && !isLoading && (
              <View style={styles.emptyState}>
                <Typography variant="h3" style={styles.emptyTitle}>No results found</Typography>
                <Typography color={COLORS.textSecondary} style={styles.emptyText}>
                  Try adjusting your filters or search query
                </Typography>
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Filters</Typography>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X color={COLORS.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Store Filter */}
              <Typography variant="bodySmall" color={COLORS.textSecondary} style={styles.filterLabel}>
                STORE
              </Typography>
              {stores.map((store) => (
                <TouchableOpacity
                  key={store}
                  style={styles.checkboxRow}
                  onPress={() => {
                    const currentStores = filters.stores || [];
                    const newStores = currentStores.includes(store)
                      ? currentStores.filter(s => s !== store)
                      : [...currentStores, store];
                    updateFilters({ stores: newStores });
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    (filters.stores || []).includes(store) && styles.checkboxChecked
                  ]}>
                    {(filters.stores || []).includes(store) && (
                      <View style={styles.checkboxInner} />
                    )}
                  </View>
                  <Typography>{store}</Typography>
                </TouchableOpacity>
              ))}

              {/* Brand Filter */}
              {availableBrands.length > 0 && (
                <>
                  <Typography variant="bodySmall" color={COLORS.textSecondary} style={styles.filterLabel}>
                    BRAND
                  </Typography>
                  {availableBrands.map((brand) => (
                    <TouchableOpacity
                      key={brand}
                      style={styles.checkboxRow}
                      onPress={() => {
                        const currentBrands = filters.brands || [];
                        const newBrands = currentBrands.includes(brand)
                          ? currentBrands.filter(b => b !== brand)
                          : [...currentBrands, brand];
                        updateFilters({ brands: newBrands });
                      }}
                    >
                      <View style={[
                        styles.checkbox,
                        (filters.brands || []).includes(brand) && styles.checkboxChecked
                      ]}>
                        {(filters.brands || []).includes(brand) && (
                          <View style={styles.checkboxInner} />
                        )}
                      </View>
                      <Typography>{brand}</Typography>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Options Filter */}
              <Typography variant="bodySmall" color={COLORS.textSecondary} style={styles.filterLabel}>
                OPTIONS
              </Typography>
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => {
                  updateFilters({ hideOutliers: !filters.hideOutliers });
                }}
              >
                <View style={[
                  styles.checkbox,
                  filters.hideOutliers && styles.checkboxChecked
                ]}>
                  {filters.hideOutliers && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
                <Typography>Hide Price Outliers</Typography>
              </TouchableOpacity>

              {/* Price Range Filter */}
              <Typography variant="bodySmall" color={COLORS.textSecondary} style={styles.filterLabel}>
                PRICE RANGE
              </Typography>
              <View style={styles.priceRangeRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={filters.minPrice?.toString() || ''}
                  onChangeText={(text) => updateFilters({ minPrice: text ? parseFloat(text) : undefined })}
                />
                <Typography color={COLORS.textSecondary}>-</Typography>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={filters.maxPrice?.toString() || ''}
                  onChangeText={(text) => updateFilters({ maxPrice: text ? parseFloat(text) : undefined })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  clearFilters();
                  setShowFilters(false);
                }}
              >
                <Typography color={COLORS.text}>Clear All</Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Typography color={COLORS.background}>Apply</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSort}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSort(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Sort By</Typography>
              <TouchableOpacity onPress={() => setShowSort(false)}>
                <X color={COLORS.text} size={24} />
              </TouchableOpacity>
            </View>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOption}
                onPress={() => {
                  updateSort(option.value as any);
                  setShowSort(false);
                }}
              >
                <Typography
                  color={sortBy === option.value ? COLORS.primary : COLORS.text}
                  style={{ fontWeight: sortBy === option.value ? '700' : '400' }}
                >
                  {option.label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  searchContainer: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 18,
    fontFamily: 'Archivo_400Regular',
  },
  clearSearchButton: {
    padding: SPACING.xs,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  filterText: {
    fontFamily: 'Archivo_700Bold',
    marginLeft: SPACING.xs,
  },
  resultsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  suggestionsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  suggestionsTitle: {
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  emptySearchState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  sortModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  filterLabel: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    marginRight: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: COLORS.primary,
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  priceRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  priceInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.text,
    fontFamily: 'Archivo_400Regular',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  sortOption: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    borderRadius: 8,
    padding: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
});
