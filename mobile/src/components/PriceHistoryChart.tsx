import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import Svg, { Path, Rect, Circle, LinearGradient, Defs, Stop, Line as SvgLine } from 'react-native-svg';
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

  const handleTap = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  if (!data || data.length === 0) {
    return null;
  }

  const { chartW, chartH } = (() => {
    const sw = Dimensions.get('window').width;
    const cw = sw - SPACING.lg * 4;
    const ch = 160;
    return { chartW: cw, chartH: ch };
  })();

  const maxPrice = Math.max(...data.map(d => d.price));
  const minPrice = Math.min(...data.map(d => d.price));
  const priceRange = maxPrice - minPrice;
  const avgPrice = Math.round(data.reduce((sum, d) => sum + d.price, 0) / data.length);
  const singleBar = data.length === 1;

  const getX = (index: number) => {
    if (singleBar) return 8 + (chartW - 16) / 2;
    return 8 + (index / (data.length - 1)) * (chartW - 16);
  };

  const getY = (price: number) => {
    if (priceRange === 0) return 20 + (chartH - 48) / 2;
    return 20 + (chartH - 48) - ((price - minPrice) / priceRange) * (chartH - 48);
  };

  const linePath = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.price);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaPath = `${linePath} L ${getX(data.length - 1)} ${chartH - 28} L ${getX(0)} ${chartH - 28} Z`;

  const useBars = data.length > 8;
  const totalBarWidth = useBars ? (chartW - 16) / data.length : 0;
  const barWidth = useBars ? Math.max(4, Math.min(12, totalBarWidth - 3)) : 0;

  // Calculate which bar/point index a tap lands on
  const hitTest = (tapX: number): number => {
    if (useBars) {
      const idx = Math.floor((tapX - 8) / totalBarWidth);
      return Math.max(0, Math.min(data.length - 1, idx));
    }
    // Line chart: find nearest point
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(getX(i) - tapX);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return closest;
  };

  const statsData = singleBar
    ? [{ label: 'CURRENT', value: `Rs. ${data[0].price.toLocaleString()}`, color: COLORS.primary }]
    : [
        { label: 'CURRENT', value: `Rs. ${data[data.length - 1].price.toLocaleString()}`, color: COLORS.primary },
        { label: 'LOWEST', value: `Rs. ${minPrice.toLocaleString()}`, color: '#00C851' },
        { label: 'HIGHEST', value: `Rs. ${maxPrice.toLocaleString()}`, color: COLORS.error },
        { label: 'AVERAGE', value: `Rs. ${avgPrice.toLocaleString()}`, color: COLORS.text },
      ];

  if (useBars) {
    return (
      <View style={styles.container}>
        <View style={styles.chartWrapper}>
          <Pressable onPress={({ nativeEvent }) => handleTap(hitTest(nativeEvent.locationX))}>
            <Svg width={chartW} height={chartH}>
              <Defs>
                <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={1} />
                  <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.35} />
                </LinearGradient>
              </Defs>
              {priceRange > 0 && (
                <>
                  <SvgLine x1={8} y1={20} x2={chartW - 8} y2={20} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="4 4" />
                  <SvgLine x1={8} y1={(chartH - 48) / 2 + 20} x2={chartW - 8} y2={(chartH - 48) / 2 + 20} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="4 4" />
                </>
              )}
              {data.map((point, index) => {
                const x = 8 + index * totalBarWidth + (totalBarWidth - barWidth) / 2;
                const barH = priceRange > 0 ? ((point.price - minPrice) / priceRange) * (chartH - 48) : (chartH - 48) / 2;
                const y = 20 + (chartH - 48) - barH;
                const isSel = selectedIndex === index;
                return (
                  <Rect key={index} x={x} y={y} width={barWidth} height={barH} rx={2}
                    fill={isSel ? COLORS.primary : 'url(#barGradient)'}
                    opacity={isSel ? 1 : 0.65}
                  />
                );
              })}
              {selectedIndex !== null && (
                <>
                  <SvgLine x1={8 + selectedIndex * totalBarWidth + totalBarWidth / 2} y1={20}
                    x2={8 + selectedIndex * totalBarWidth + totalBarWidth / 2} y2={chartH - 28}
                    stroke={COLORS.primary} strokeWidth={1} strokeDasharray="3 3" />
                  <Circle cx={8 + selectedIndex * totalBarWidth + totalBarWidth / 2}
                    cy={getY(data[selectedIndex].price)} r={4} fill={COLORS.primary} />
                </>
              )}
            </Svg>
          </Pressable>
        </View>

        {selectedIndex !== null && (
          <View style={styles.tooltipCard}>
            <Typography variant="mono" style={styles.tooltipDate}>{data[selectedIndex].date}</Typography>
            <Typography variant="monoBold" color={COLORS.primary} style={styles.tooltipPrice}>
              Rs. {data[selectedIndex].price.toLocaleString()}
            </Typography>
          </View>
        )}

        <View style={styles.stats}>
          {statsData.map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Typography variant="mono" style={styles.statLabel}>{s.label}</Typography>
              <Typography variant="h3" color={s.color as any}>{s.value}</Typography>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Line chart
  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Pressable onPress={({ nativeEvent }) => handleTap(hitTest(nativeEvent.locationX))}>
          <Svg width={chartW} height={chartH}>
            <Defs>
              <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
                <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
              </LinearGradient>
            </Defs>
            {priceRange > 0 && (
              <>
                <SvgLine x1={8} y1={20} x2={chartW - 8} y2={20} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="4 4" />
                <SvgLine x1={8} y1={(chartH - 48) / 2 + 20} x2={chartW - 8} y2={(chartH - 48) / 2 + 20} stroke={COLORS.border} strokeWidth={0.5} strokeDasharray="4 4" />
                <SvgLine x1={8} y1={chartH - 28} x2={chartW - 8} y2={chartH - 28} stroke={COLORS.border} strokeWidth={0.5} />
              </>
            )}
            {data.length > 1 && <Path d={areaPath} fill="url(#areaGrad)" />}
            <Path d={linePath} fill="none" stroke={COLORS.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {data.map((point, index) => (
              <Circle key={index} cx={getX(index)} cy={getY(point.price)}
                r={selectedIndex === index ? 6 : 4}
                fill={selectedIndex === index ? COLORS.primary : COLORS.background}
                stroke={COLORS.primary} strokeWidth={2}
              />
            ))}
            {selectedIndex !== null && data.length > 1 && (
              <SvgLine x1={getX(selectedIndex)} y1={20} x2={getX(selectedIndex)} y2={chartH - 28}
                stroke={COLORS.primary} strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
            )}
          </Svg>
        </Pressable>
      </View>

      {selectedIndex !== null && (
        <View style={styles.tooltipCard}>
          <Typography variant="mono" style={styles.tooltipDate}>{data[selectedIndex].date}</Typography>
          <Typography variant="monoBold" color={COLORS.primary} style={styles.tooltipPrice}>
            Rs. {data[selectedIndex].price.toLocaleString()}
          </Typography>
        </View>
      )}

      <View style={styles.stats}>
        {statsData.map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Typography variant="mono" style={styles.statLabel}>{s.label}</Typography>
            <Typography variant="h3" color={s.color as any}>{s.value}</Typography>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
  },
  chartWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  tooltipCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    padding: SPACING.sm,
    marginHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  tooltipDate: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  tooltipPrice: {
    fontSize: 13,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    marginHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: {
    width: '47%',
    paddingVertical: SPACING.xs,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
});
