import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography } from './Typography';
import { Button } from './Button';

interface ProductCardProps {
  id: string;
  name: string;
  price: string;
  store: string;
  rating: number;
  image: string;
  onPress: () => void;
  onTrackPress?: () => void;
  badge?: string;
  specs?: string;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  store,
  rating,
  image,
  onPress,
  onTrackPress,
  badge,
  specs,
  isWishlisted,
  onWishlistToggle,
}) => {
  const [imageError, setImageError] = React.useState(false);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        {image && !imageError ? (
          <Image
            source={{ uri: image }}
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Typography variant="caption" color={COLORS.textSecondary}>📦</Typography>
            <Typography variant="caption" color={COLORS.textSecondary} style={{ marginTop: 4 }}>
              {name.split(' ')[0]}
            </Typography>
          </View>
        )}
        {badge && (
          <View style={styles.badge}>
            <Typography variant="caption" color={COLORS.background} style={styles.badgeText}>
              {badge}
            </Typography>
          </View>
        )}
        {onWishlistToggle && (
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={(e) => {
              e.stopPropagation();
              onWishlistToggle();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              color={isWishlisted ? COLORS.error : COLORS.text}
              fill={isWishlisted ? COLORS.error : 'transparent'}
              size={18}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="bodySmall" color={COLORS.textSecondary} numberOfLines={1}>
            {store}
          </Typography>
          <Typography variant="bodySmall" color={COLORS.primary}>
            ★ {rating.toFixed(1)}
          </Typography>
        </View>

        <Typography variant="h3" style={styles.name} numberOfLines={2}>
          {name}
        </Typography>

        {specs && (
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.specs} numberOfLines={1}>
            {specs}
          </Typography>
        )}

        <View style={styles.footer}>
          <Typography variant="monoBold" color={COLORS.primary} style={styles.price}>
            {price}
          </Typography>
          {onTrackPress && (
            <Button 
              title="TRACK" 
              size="sm" 
              variant="outline" 
              onPress={onTrackPress}
              style={styles.trackButton}
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  badge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  wishlistButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: BORDER_RADIUS.full,
  },
  badgeText: {
    fontFamily: 'Archivo_700Bold',
    fontSize: 10,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  name: {
    marginBottom: SPACING.xs,
  },
  specs: {
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  price: {
    fontSize: 18,
  },
  trackButton: {
    paddingHorizontal: SPACING.md,
  },
});
