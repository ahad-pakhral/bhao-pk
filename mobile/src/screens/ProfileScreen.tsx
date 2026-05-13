import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert, Image, Linking } from 'react-native';
import { User, Settings, Heart, Bell, History, LogOut, ChevronRight, ExternalLink } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { useAlerts } from '../hooks/useAlerts';
import { useUserStats } from '../hooks/useUserStats';
export const ProfileScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { alerts } = useAlerts();
  const { stats } = useUserStats();

  const handleMenuPress = (title: string) => {
    switch (title) {
      case 'Wishlist':
        navigation.navigate('Wishlist');
        break;
      case 'Price Alerts':
        navigation.navigate('Alerts');
        break;
      case 'Search History':
        navigation.navigate('SearchHistory');
        break;
      case 'Settings':
        navigation.navigate('Settings');
        break;
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <User color={COLORS.background} size={40} />
            </View>
            <Typography variant="h2">Login Required</Typography>
            <Typography color={COLORS.textSecondary} style={{ textAlign: 'center', marginTop: SPACING.xs }}>
              Login to access wishlist, alerts, and history.
            </Typography>
            <Button
              title="GO TO LOGIN"
              onPress={() => navigation.navigate('Login')}
              style={styles.editButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const displayName = user.name || user.email;
  const activeAlertsCount = alerts.filter((a: any) => !a.isNotified).length;
  const displayStats = {
    wishlistCount: stats?.wishlistCount ?? wishlist.length,
    activeAlertsCount: stats?.activeAlertsCount ?? activeAlertsCount,
    searchesCount: stats?.searchesCount ?? 0,
  };

  const menuItems = [
    { icon: <Heart color={COLORS.primary} size={20} />, title: 'Wishlist', subtitle: `${displayStats.wishlistCount} items saved` },
    { icon: <Bell color={COLORS.primary} size={20} />, title: 'Price Alerts', subtitle: `${displayStats.activeAlertsCount} active alerts` },
    { icon: <History color={COLORS.primary} size={20} />, title: 'Search History', subtitle: 'View past searches' },
    { icon: <Settings color={COLORS.primary} size={20} />, title: 'Settings', subtitle: 'Profile, Notifications' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <User color={COLORS.background} size={40} />
          </View>
          <Typography variant="h2">{displayName}</Typography>
          <Typography color={COLORS.textSecondary}>{user.email}</Typography>
          <Button
            title="Edit Profile"
            variant="outline"
            size="sm"
            onPress={handleEditProfile}
            style={styles.editButton}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Typography variant="h3" color={COLORS.primary}>{displayStats.wishlistCount}</Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>WISHLIST</Typography>
          </View>
          <View style={styles.statBox}>
            <Typography variant="h3" color={COLORS.primary}>{displayStats.activeAlertsCount}</Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>ALERTS</Typography>
          </View>
          <View style={styles.statBox}>
            <Typography variant="h3" color={COLORS.primary}>{displayStats.searchesCount}</Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>SEARCHES</Typography>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.title)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>{item.icon}</View>
              <View style={styles.menuText}>
                <Typography>{item.title}</Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>{item.subtitle}</Typography>
              </View>
              <ChevronRight color={COLORS.border} size={20} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
            YOUR WISHLIST
          </Typography>
          {wishlist.length === 0 ? (
            <View style={styles.emptyCard}>
              <Typography color={COLORS.textSecondary}>Your wishlist is empty.</Typography>
              <Button title="DISCOVER PRODUCTS" onPress={() => navigation.navigate('Search')} style={{ marginTop: SPACING.md }} />
            </View>
          ) : (
            <>
              {wishlist.slice(0, 3).map((item: any) => (
                <View key={item.id} style={styles.previewRow}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.previewImagePlaceholder} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Typography numberOfLines={2} style={{ fontWeight: '700' }}>{item.name}</Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>{item.store}</Typography>
                  </View>
                  <TouchableOpacity
                    style={styles.previewAction}
                    onPress={() => Linking.openURL(item.url).catch(() => {})}
                  >
                    <ExternalLink size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              {wishlist.length > 3 && (
                <Button title={`VIEW ALL (${wishlist.length})`} variant="outline" onPress={() => navigation.navigate('Wishlist')} style={{ marginTop: SPACING.md }} />
              )}
            </>
          )}
        </View>

        <View style={styles.sectionBlock}>
          <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
            PRICE ALERTS
          </Typography>
          {alerts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Typography color={COLORS.textSecondary}>No alerts set.</Typography>
              <Button title="BROWSE PRODUCTS" onPress={() => navigation.navigate('Search')} style={{ marginTop: SPACING.md }} />
            </View>
          ) : (
            <>
              {alerts.slice(0, 3).map((a: any) => (
                <View key={a.id} style={styles.previewRow}>
                  <View style={{ flex: 1 }}>
                    <Typography numberOfLines={2} style={{ fontWeight: '700' }}>{a.product?.name || a.keyword || a.productUrl || 'Alert'}</Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Target: Rs. {Number(a.targetPrice || 0).toLocaleString()}
                    </Typography>
                  </View>
                  <View style={[styles.badge, a.isNotified ? styles.badgeMuted : styles.badgeHot]}>
                    <Typography variant="caption" color={COLORS.background} style={{ fontWeight: '700' }}>
                      {a.isNotified ? 'Triggered' : 'Active'}
                    </Typography>
                  </View>
                </View>
              ))}
              {alerts.length > 3 && (
                <Button title={`VIEW ALL (${alerts.length})`} variant="outline" onPress={() => navigation.navigate('Alerts')} style={{ marginTop: SPACING.md }} />
              )}
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut color={COLORS.error} size={20} />
          <Typography color={COLORS.error} style={{ marginLeft: SPACING.sm }}>Logout</Typography>
        </TouchableOpacity>
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
  content: {
    paddingBottom: SPACING.xl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  editButton: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  menuSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuIcon: {
    marginRight: SPACING.md,
  },
  menuText: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
  sectionBlock: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  previewImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
  },
  previewImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewAction: {
    padding: SPACING.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeHot: {
    backgroundColor: COLORS.primary,
  },
  badgeMuted: {
    backgroundColor: COLORS.textSecondary,
  },
});
