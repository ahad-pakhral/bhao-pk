import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Trash2, TrendingDown, ChevronDown, ChevronUp, ExternalLink, Store } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography } from './Typography';
import { SmartAlert } from '../types/models';

interface SmartAlertCardProps {
  alert: SmartAlert;
  onRemove: (id: string) => void;
  onViewProduct: (productId: string) => void;
}

export const SmartAlertCard: React.FC<SmartAlertCardProps> = ({
  alert,
  onRemove,
  onViewProduct,
}) => {
  const [showAlternatives, setShowAlternatives] = useState(false);

  const isNearTarget = alert.bestCurrentPrice <= alert.targetPrice * 1.1;
  const progressPercent = alert.originalPrice > alert.targetPrice
    ? Math.min(100, Math.max(0,
        ((alert.originalPrice - alert.bestCurrentPrice) / (alert.originalPrice - alert.targetPrice)) * 100
      ))
    : 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={{ uri: alert.productImage }} style={styles.productImage} />
        <View style={styles.headerInfo}>
          <Typography variant="h3" numberOfLines={2}>{alert.productName}</Typography>
          <Typography variant="caption" color={COLORS.textSecondary}>
            {alert.category} | {alert.alertType === 'every_change' ? 'Every Change' : 'Target Price'}
          </Typography>
        </View>
        <TouchableOpacity onPress={() => onRemove(alert.id)} style={styles.deleteBtn}>
          <Trash2 color={COLORS.error} size={18} />
        </TouchableOpacity>
      </View>

      {/* Cross-Store Prices */}
      {alert.trackedStores.length > 0 && (
        <View style={styles.section}>
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.sectionTitle}>
            PRICES ACROSS STORES
          </Typography>
          {alert.trackedStores.map((snapshot, idx) => {
            const isBest = snapshot.price === alert.bestCurrentPrice;
            return (
              <View key={idx} style={styles.storeRow}>
                <View style={styles.storeNameCol}>
                  <Typography variant="body" color={isBest ? COLORS.primary : COLORS.text}>
                    {snapshot.store}
                  </Typography>
                </View>
                <Typography variant="monoBold" color={isBest ? COLORS.primary : COLORS.text}>
                  Rs. {snapshot.price.toLocaleString()}
                </Typography>
                {snapshot.priceChangePercent != null && snapshot.priceChangePercent !== 0 && (
                  <Typography
                    variant="caption"
                    color={snapshot.priceChangePercent < 0 ? COLORS.success : COLORS.error}
                    style={styles.priceDelta}
                  >
                    {snapshot.priceChangePercent < 0 ? '' : '+'}{snapshot.priceChangePercent.toFixed(0)}%
                  </Typography>
                )}
                {isBest && (
                  <View style={styles.bestBadge}>
                    <Typography variant="caption" color={COLORS.background}>BEST</Typography>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Target Progress */}
      <View style={styles.section}>
        <View style={styles.targetRow}>
          <View>
            <Typography variant="caption" color={COLORS.textSecondary}>BEST PRICE</Typography>
            <Typography variant="monoBold" color={COLORS.primary}>
              Rs. {alert.bestCurrentPrice.toLocaleString()}
            </Typography>
          </View>
          <TrendingDown color={isNearTarget ? COLORS.success : COLORS.textSecondary} size={20} />
          <View>
            <Typography variant="caption" color={COLORS.textSecondary}>TARGET</Typography>
            <Typography variant="monoBold" color={COLORS.text}>
              Rs. {alert.targetPrice.toLocaleString()}
            </Typography>
          </View>
        </View>
        {alert.alertType === 'target_price' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        )}
        {isNearTarget && (
          <View style={styles.nearTargetBadge}>
            <Typography variant="caption" color={COLORS.success}>NEAR TARGET!</Typography>
          </View>
        )}
      </View>

      {/* Alternatives */}
      {alert.alternatives.length > 0 && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.alternativesHeader}
            onPress={() => setShowAlternatives(!showAlternatives)}
          >
            <Typography variant="caption" color={COLORS.textSecondary}>
              BETTER ALTERNATIVES ({alert.alternatives.length})
            </Typography>
            {showAlternatives
              ? <ChevronUp color={COLORS.textSecondary} size={16} />
              : <ChevronDown color={COLORS.textSecondary} size={16} />
            }
          </TouchableOpacity>

          {showAlternatives && alert.alternatives.map((alt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.altRow}
              onPress={() => onViewProduct(alt.productId)}
            >
              <Image source={{ uri: alt.productImage }} style={styles.altImage} />
              <View style={styles.altInfo}>
                <Typography variant="body" numberOfLines={1}>{alt.productName}</Typography>
                <View style={styles.altMeta}>
                  <Typography variant="monoBold" color={COLORS.primary}>
                    Rs. {alt.price.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color={COLORS.textSecondary}>
                    {alt.store}
                  </Typography>
                </View>
                <View style={styles.reasonBadge}>
                  <Typography variant="caption" color={COLORS.success}>{alt.reason}</Typography>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Actions */}
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => onViewProduct(alert.productId)}
      >
        <Typography variant="caption" color={COLORS.background}>VIEW PRODUCT</Typography>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  headerInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  deleteBtn: {
    padding: SPACING.xs,
  },
  section: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  storeNameCol: {
    flex: 1,
  },
  priceDelta: {
    marginLeft: SPACING.sm,
    width: 40,
    textAlign: 'right',
  },
  bestBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 2,
    marginTop: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  nearTargetBadge: {
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  alternativesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  altImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
  },
  altInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  altMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  reasonBadge: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  viewButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
});
