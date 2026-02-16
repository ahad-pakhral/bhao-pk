import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TextInput, TouchableOpacity, Modal, Keyboard } from 'react-native';
import { Search, Bell, X } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, ProductCard, Logo } from '../components';
import { TRENDING_PRODUCTS, RECENTLY_VIEWED, ALL_PRODUCTS } from '../constants/dummyData';
import { useWishlist } from '../hooks/useWishlist';

export const HomeScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();

  const filteredSuggestions = searchQuery.trim()
    ? ALL_PRODUCTS.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.specs?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.store?.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

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
            {showSuggestions && filteredSuggestions.length > 0 && (
              <View style={styles.suggestionsDropdown}>
                {filteredSuggestions.map((product) => (
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
            {TRENDING_PRODUCTS.map((product) => (
              <View key={product.id} style={styles.trendingItem}>
                <ProductCard
                  {...product}
                  onPress={() => navigation.navigate('ProductDetail', { product })}
                  isWishlisted={isInWishlist(product.id)}
                  onWishlistToggle={() => toggleWishlist(product.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
            RECENTLY VIEWED
          </Typography>
          {RECENTLY_VIEWED.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onPress={() => navigation.navigate('ProductDetail', { product })}
              isWishlisted={isInWishlist(product.id)}
              onWishlistToggle={() => toggleWishlist(product.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
            RECOMMENDED FOR YOU
          </Typography>
          <ProductCard
            id="rec-1"
            name="Samsung S24 Ultra"
            price="Rs. 320,000"
            store="Daraz.pk"
            rating={4.8}
            image="https://images.unsplash.com/photo-1707248107510-09e23652697b?q=80&w=400"
            badge="SAVE 20%"
            onPress={() => {}}
            onTrackPress={() => {}}
            specs="Titanium Gray • 512GB"
            isWishlisted={isInWishlist('rec-1')}
            onWishlistToggle={() => toggleWishlist('rec-1')}
          />
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
});
