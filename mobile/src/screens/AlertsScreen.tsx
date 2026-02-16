import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Bell, Trash2, TrendingDown, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';
import { alertsStorage } from '../services/storage.service';
import { Alert } from '../types/models';
import Toast from 'react-native-toast-message';

export const AlertsScreen = ({ navigation }: any) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const items = await alertsStorage.getAlerts();
      setAlerts(items);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeAlert = async (alertId: string) => {
    try {
      await alertsStorage.removeAlert(alertId);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      Toast.show({
        type: 'info',
        text1: 'Alert deleted',
      });
    } catch (error) {
      console.error('Failed to remove alert:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Typography>Loading alerts...</Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (alerts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Typography variant="h3">Price Alerts</Typography>
            <Typography color={COLORS.textSecondary} variant="caption">
              {alerts.length} active
            </Typography>
          </View>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Bell color={COLORS.textSecondary} size={64} strokeWidth={1} />
          <Typography variant="h3" style={styles.emptyTitle}>
            No active alerts
          </Typography>
          <Typography color={COLORS.textSecondary} style={styles.emptyMessage}>
            Set price alerts on products to get notified when prices drop
          </Typography>
          <Button
            title="BROWSE PRODUCTS"
            onPress={() => navigation.goBack()}
            style={styles.browseButton}
          />
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
          <Typography variant="h3">Price Alerts</Typography>
          <Typography color={COLORS.textSecondary} variant="caption">
            {alerts.length} active
          </Typography>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {alerts.map((alert) => {
          const priceDropPercent = ((alert.currentPrice - alert.targetPrice) / alert.currentPrice * 100).toFixed(0);
          const isNearTarget = alert.currentPrice <= alert.targetPrice * 1.1;

          return (
            <View key={alert.id} style={styles.alertCard}>
              <Image
                source={{ uri: alert.productImage }}
                style={styles.productImage}
              />
              <View style={styles.alertContent}>
                <Typography variant="h4" numberOfLines={2} style={styles.productName}>
                  {alert.productName}
                </Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  {alert.store}
                </Typography>

                <View style={styles.priceRow}>
                  <View>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      CURRENT
                    </Typography>
                    <Typography variant="monoBold" color={COLORS.text}>
                      Rs. {alert.currentPrice.toLocaleString()}
                    </Typography>
                  </View>
                  <TrendingDown
                    color={isNearTarget ? COLORS.success : COLORS.textSecondary}
                    size={20}
                  />
                  <View>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      TARGET
                    </Typography>
                    <Typography variant="monoBold" color={COLORS.primary}>
                      Rs. {alert.targetPrice.toLocaleString()}
                    </Typography>
                  </View>
                </View>

                {isNearTarget && (
                  <View style={styles.nearTargetBadge}>
                    <Typography variant="caption" color={COLORS.success}>
                      🎯 NEAR TARGET!
                    </Typography>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeAlert(alert.id)}
              >
                <Trash2 color={COLORS.error} size={18} />
              </TouchableOpacity>
            </View>
          );
        })}
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
    paddingHorizontal: SPACING.xl * 2,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
  },
  alertContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  productName: {
    marginBottom: SPACING.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  nearTargetBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
});
