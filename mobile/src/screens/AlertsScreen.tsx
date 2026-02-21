import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Bell, ArrowLeft, RefreshCw } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';
import { SmartAlertCard } from '../components/SmartAlertCard';
import { useSmartAlerts } from '../hooks/useSmartAlerts';
import Toast from 'react-native-toast-message';

export const AlertsScreen = ({ navigation }: any) => {
  const { alerts, triggeredAlerts, loading, removeAlert, refreshPrices } = useSmartAlerts();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRemove = async (id: string) => {
    await removeAlert(id);
    Toast.show({ type: 'info', text1: 'Alert deleted' });
  };

  const handleViewProduct = (productId: string) => {
    const { ALL_PRODUCTS } = require('../constants/dummyData');
    const product = ALL_PRODUCTS.find((p: any) => p.id === productId);
    if (product) {
      navigation.navigate('ProductDetail', { product });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshPrices();
    setRefreshing(false);
    Toast.show({ type: 'success', text1: 'Prices updated' });
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Typography variant="h3">Smart Alerts</Typography>
          <Typography color={COLORS.textSecondary} variant="caption">
            {alerts.length} active{triggeredAlerts.length > 0 ? ` • ${triggeredAlerts.length} triggered` : ''}
          </Typography>
        </View>
        <TouchableOpacity onPress={handleRefresh}>
          <RefreshCw color={COLORS.text} size={20} />
        </TouchableOpacity>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Bell color={COLORS.textSecondary} size={64} strokeWidth={1} />
          <Typography variant="h3" style={styles.emptyTitle}>
            No active alerts
          </Typography>
          <Typography color={COLORS.textSecondary} style={styles.emptyMessage}>
            Set price alerts on products to track prices across all stores and discover better alternatives
          </Typography>
          <Button
            title="BROWSE PRODUCTS"
            onPress={() => navigation.goBack()}
            style={styles.browseButton}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {triggeredAlerts.length > 0 && (
            <View style={styles.triggeredSection}>
              <Typography variant="caption" color={COLORS.success} style={styles.sectionLabel}>
                TRIGGERED ALERTS
              </Typography>
              {triggeredAlerts.map(alert => (
                <SmartAlertCard
                  key={alert.id}
                  alert={alert}
                  onRemove={handleRemove}
                  onViewProduct={handleViewProduct}
                />
              ))}
            </View>
          )}

          <Typography variant="caption" color={COLORS.textSecondary} style={styles.sectionLabel}>
            {triggeredAlerts.length > 0 ? 'ALL ALERTS' : `${alerts.length} ALERT${alerts.length !== 1 ? 'S' : ''}`}
          </Typography>
          {alerts.map(alert => (
            <SmartAlertCard
              key={alert.id}
              alert={alert}
              onRemove={handleRemove}
              onViewProduct={handleViewProduct}
            />
          ))}
        </ScrollView>
      )}
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
  triggeredSection: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
});
