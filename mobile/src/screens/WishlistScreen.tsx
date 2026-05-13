import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { Heart, Trash2, ShoppingBag, ArrowLeft, ExternalLink } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';
import { useWishlist } from '../hooks/useWishlist';
import { useAuth } from '../context/AuthContext';

export const WishlistScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const { wishlist, loading, toggleWishlist } = useWishlist();

  const removeFromWishlist = async (item: any) => {
    try {
      await toggleWishlist({ store: item.store, url: item.url, name: item.name, imageUrl: item.imageUrl });
    } catch (e) {
      console.error('Failed to remove from wishlist:', e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Typography>Loading wishlist...</Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Typography variant="h3">Wishlist</Typography>
            <Typography color={COLORS.textSecondary} variant="caption">
              Login required
            </Typography>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Heart color={COLORS.textSecondary} size={64} strokeWidth={1} />
          <Typography variant="h3" style={styles.emptyTitle}>
            Login required
          </Typography>
          <Typography color={COLORS.textSecondary} style={styles.emptyMessage}>
            Please login to use wishlist.
          </Typography>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Login')}>
            <ShoppingBag color={COLORS.background} size={20} />
            <Typography color={COLORS.background} style={styles.browseButtonText}>
              GO TO LOGIN
            </Typography>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (wishlist.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Typography variant="h3">Wishlist</Typography>
            <Typography color={COLORS.textSecondary} variant="caption">
              0 items
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
            {wishlist.length} items
          </Typography>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {wishlist.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <TouchableOpacity
              style={styles.itemTopRow}
              activeOpacity={0.9}
              onPress={() => {
                navigation.navigate('ProductDetail', {
                  product: {
                    url: item.url,
                    store: item.store,
                    name: item.name,
                    image: item.imageUrl || undefined,
                  },
                });
              }}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              ) : (
                <View style={styles.itemImagePlaceholder} />
              )}
              <View style={styles.itemInfo}>
                <Typography variant="body" numberOfLines={2} style={{ fontWeight: '700' }}>
                  {item.name}
                </Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  {item.store}
                </Typography>
              </View>
            </TouchableOpacity>

            <View style={styles.itemActions}>
              <Button
                title="VISIT STORE"
                size="sm"
                variant="outline"
                onPress={() => {
                  Linking.openURL(item.url).catch(() => {});
                }}
                icon={<ExternalLink size={16} color={COLORS.primary} />}
              />
              <TouchableOpacity style={styles.removeButton} onPress={() => removeFromWishlist(item)}>
                <Trash2 color={COLORS.error} size={20} />
              </TouchableOpacity>
            </View>
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
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: SPACING.md,
    backgroundColor: '#1a1a1a',
  },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: SPACING.md,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.md,
  },
  removeButton: {
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
