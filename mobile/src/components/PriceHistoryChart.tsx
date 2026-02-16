import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../theme';
import { Typography } from './Typography';

interface PricePoint {
  date: string;
  price: number;
}

interface PriceHistoryChartProps {
  data: PricePoint[];
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({ data }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography color="#666">No price history available</Typography>
      </View>
    );
  }

  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const avgPrice = Math.round(data.reduce((sum, d) => sum + d.price, 0) / data.length);

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        {data.map((point, index) => {
          const height = priceRange > 0 ? ((point.price - minPrice) / priceRange) * 140 + 20 : 50;
          const isSelected = selectedIndex === index;

          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => setSelectedIndex(isSelected ? null : index)}
              style={styles.barWrapper}
            >
              {isSelected && (
                <View style={styles.tooltip}>
                  <Typography variant="mono" style={styles.tooltipDate}>{point.date}</Typography>
                  <Typography variant="monoBold" color={COLORS.primary} style={styles.tooltipPrice}>
                    Rs. {point.price.toLocaleString()}
                  </Typography>
                </View>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height,
                    backgroundColor: isSelected ? COLORS.primary : '#333',
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Typography variant="mono" style={styles.statLabel}>CURRENT</Typography>
          <Typography variant="h4" color={COLORS.primary}>
            Rs. {data[data.length - 1].price.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.statItem}>
          <Typography variant="mono" style={styles.statLabel}>LOWEST</Typography>
          <Typography variant="h4" color="#00FF88">
            Rs. {minPrice.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.statItem}>
          <Typography variant="mono" style={styles.statLabel}>HIGHEST</Typography>
          <Typography variant="h4" color="#CCFF00">
            Rs. {maxPrice.toLocaleString()}
          </Typography>
        </View>
        <View style={styles.statItem}>
          <Typography variant="mono" style={styles.statLabel}>AVERAGE</Typography>
          <Typography variant="h4">
            Rs. {avgPrice.toLocaleString()}
          </Typography>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  chartContainer: {
    height: 180,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 6,
  },
  bar: {
    width: '100%',
    minWidth: 6,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    zIndex: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  tooltipDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  tooltipPrice: {
    fontSize: 12,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    marginHorizontal: SPACING.lg,
  },
  statItem: {
    width: '47%',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
});
