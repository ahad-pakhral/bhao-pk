import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Heart, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, ProductCard } from '../components';
import { wishlistStorage } from '../services/storage.service';
import { ALL_PRODUCTS } from '../constants/dummyData';
import Toast from 'react-native-toast-message';

export const WishlistScreen = ({ navigation }: any) => {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const items = await wishlistStorage.getWishlist();
      setWishlist(items);
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await wishlistStorage.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(id => id !== productId));
      Toast.show({
        type: 'info',
        text1: 'Removed from wishlist',
      });
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  // Get product details for wishlist items
  const wishlistProducts = ALL_PRODUCTS.filter(p => wishlist.includes(p.id));

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Typography>Loading wishlist...</Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Typography variant="h3">Wishlist</Typography>
            <Typography color={COLORS.textSecondary} variant="caption">
              {wishlist.length} items
            </Typography>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Heart color={COLORS.textSecondary} size={64} strokeWidth={1} />
          <Typography variant="h3" style={styles.emptyTitle}>
            Your wishlist is empty
          </Typography>
          <Typography color={COLORS.textSecondary} style={styles.emptyMessage}>
            Start adding products you love to keep track of them
          </Typography>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.goBack()}
          >
            <ShoppingBag color={COLORS.background} size={20} />
            <Typography color={COLORS.background} style={styles.browseButtonText}>
              BROWSE PRODUCTS
            </Typography>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Typography variant="h3">Wishlist</Typography>
          <Typography color={COLORS.textSecondary} variant="caption">
            {wishlistProducts.length} items
          </Typography>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {wishlistProducts.map((product) => (
          <View key={product.id} style={styles.productWrapper}>
            <ProductCard
              {...product}
              onPress={() => navigation.navigate('ProductDetail', { product })}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFromWishlist(product.id)}
            >
              <Trash2 color={COLORS.error} size={20} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  productWrapper: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  emptyMessage: {
    textAlign: 'center',
    marginBottom: SPACING.xl * 2,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  browseButtonText: {
    fontFamily: 'Archivo_700Bold',
  },
});
