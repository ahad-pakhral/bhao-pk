import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Bell, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

function normalizeStoreKey(store: string | null | undefined): string | null {
  if (!store) return null;
  const s = String(store).trim().toLowerCase();
  if (!s) return null;
  if (s.includes('daraz')) return 'daraz';
  if (s.includes('shophive')) return 'shophive';
  if (s.includes('telemart')) return 'telemart';
  if (s.includes('mega')) return 'mega';
  if (s.includes('priceoye')) return 'priceoye';
  return s;
}

function deriveStoreKeyFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes('daraz')) return 'daraz';
    if (hostname.includes('shophive')) return 'shophive';
    if (hostname.includes('telemart')) return 'telemart';
    if (hostname.includes('mega')) return 'mega';
    if (hostname.includes('priceoye')) return 'priceoye';
  } catch {}
  return null;
}

function formatStoreLabel(storeKey: string | null): string {
  if (!storeKey) return 'Unknown';
  switch (storeKey) {
    case 'daraz': return 'Daraz';
    case 'shophive': return 'Shophive';
    case 'telemart': return 'Telemart';
    case 'mega': return 'Mega';
    case 'priceoye': return 'PriceOye';
    default: return storeKey;
  }
}

export const AlertsScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const { alerts, loading, deleteAlert, loadAlerts } = useAlerts();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRemove = async (id: string) => {
    await deleteAlert(id);
    Toast.show({ type: 'info', text1: 'Alert deleted' });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
    Toast.show({ type: 'success', text1: 'Alerts refreshed' });
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
          <Typography variant="h3">Price Alerts</Typography>
          <Typography color={COLORS.textSecondary} variant="caption">
            {alerts.length} active
          </Typography>
        </View>
        <TouchableOpacity onPress={handleRefresh}>
          <RefreshCw color={COLORS.text} size={20} />
        </TouchableOpacity>
      </View>

      {!isAuthenticated ? (
        <View style={styles.emptyState}>
          <Bell color={COLORS.textSecondary} size={64} strokeWidth={1} />
          <Typography variant="h3" style={styles.emptyTitle}>
            Login required
          </Typography>
          <Typography color={COLORS.textSecondary} style={styles.emptyMessage}>
            Please login to view and manage your price alerts.
          </Typography>
          <Button title="GO TO LOGIN" onPress={() => navigation.navigate('Login')} style={styles.browseButton} />
        </View>
      ) : alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <Bell color={COLORS.textSecondary} size={64} strokeWidth={1} />
          <Typography variant="h3" style={styles.emptyTitle}>
            No active alerts
          </Typography>
          <Typography color={COLORS.textSecondary} style={styles.emptyMessage}>
            Set a price alert on any product to get notified when it drops to your target price.
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
          <Typography variant="caption" color={COLORS.textSecondary} style={styles.sectionLabel}>
            {alerts.length} ALERT{alerts.length !== 1 ? 'S' : ''}
          </Typography>

          {alerts.map((alert) => {
            const productUrl = alert.productUrl || '';
            const title = alert.product?.name || productUrl || alert.keyword || 'Alert';
            const currentPrice = typeof alert.product?.price === 'number' ? alert.product?.price : null;
            const storeKey =
              normalizeStoreKey(alert.product?.store || '') ||
              (productUrl ? deriveStoreKeyFromUrl(productUrl) : null);
            const storeLabel = formatStoreLabel(storeKey);
            const targetNum = Number(alert.targetPrice || 0);
            const targetReached = !!alert.isNotified || (targetNum > 0 && currentPrice != null && currentPrice > 0 && currentPrice <= targetNum);
            return (
              <TouchableOpacity
                key={alert.id}
                style={styles.alertCard}
                activeOpacity={0.9}
                onPress={() => {
                  if (!productUrl) return;
                  navigation.navigate('ProductDetail', {
                    product: {
                      url: productUrl,
                      store: storeKey || alert.product?.store || '',
                      name: alert.product?.name || '',
                      image: alert.product?.imageUrl || undefined,
                      priceValue: currentPrice ?? undefined,
                      price: currentPrice ? `Rs. ${Math.round(currentPrice).toLocaleString()}` : undefined,
                    },
                  });
                }}
              >
                <View style={styles.alertRow}>
                  {alert.product?.imageUrl ? (
                    <Image source={{ uri: alert.product.imageUrl }} style={styles.alertImage} />
                  ) : (
                    <View style={styles.alertImagePlaceholder} />
                  )}
                  <View style={styles.alertInfo}>
                    <Typography variant="body" numberOfLines={2} style={{ fontWeight: '700' }}>
                      {title}
                    </Typography>
                    {storeKey ? (
                      <Typography variant="caption" color={COLORS.primary} style={{ marginTop: 2 }}>
                        {storeLabel}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Target: Rs. {Number(alert.targetPrice || 0).toLocaleString()}
                    </Typography>
                    {currentPrice !== null && (
                      <Typography variant="caption" color={COLORS.textSecondary}>
                        Current: Rs. {Math.round(currentPrice).toLocaleString()}
                      </Typography>
                    )}
                    {targetReached ? (
                      <View style={styles.reachedBadge}>
                        <Typography variant="caption" color={COLORS.background} style={{ fontWeight: '700' }}>
                          TARGET REACHED
                        </Typography>
                      </View>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemove(alert.id);
                    }}
                    style={styles.deleteButton}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
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
  sectionLabel: {
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  alertCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: SPACING.md,
    backgroundColor: '#1a1a1a',
  },
  alertImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: SPACING.md,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alertInfo: {
    flex: 1,
  },
  deleteButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  reachedBadge: {
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.success,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
