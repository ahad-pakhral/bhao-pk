import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, Share, Linking } from 'react-native';
import { User, Bell, Globe, Shield, Info, ChevronRight, ArrowLeft, Download, Trash2, Lock } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography } from '../components';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api/client';
import Toast from 'react-native-toast-message';

const WEBAPP_BASE = process.env.EXPO_PUBLIC_WEBAPP_BASE_URL || 'http://localhost:3000';

export const SettingsScreen = ({ navigation }: any) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  // Load notification preference from storage
  useEffect(() => {
    AsyncStorage.getItem('notifications_enabled').then((val) => {
      if (val !== null) setNotificationsEnabled(val === 'true');
    });
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notifications_enabled', String(value));
    Toast.show({
      type: 'success',
      text1: value ? 'Notifications enabled' : 'Notifications disabled',
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  type SettingItem = {
    icon: React.ReactNode;
    label: string;
    value?: string | boolean;
    onPress?: () => void;
    toggle?: boolean;
    onToggle?: (value: boolean) => void;
  };

  const settingSections: { title: string, items: SettingItem[] }[] = [
    {
      title: 'ACCOUNT',
      items: [
        {
          icon: <User color={COLORS.primary} size={20} />,
          label: 'Profile Information',
          value: user?.name || user?.email || 'Guest',
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          icon: <Bell color={COLORS.primary} size={20} />,
          label: 'Push Notifications',
          toggle: true,
          value: notificationsEnabled,
          onToggle: handleNotificationToggle,
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        {
          icon: <Globe color={COLORS.primary} size={20} />,
          label: 'Language',
          value: 'English',
          onPress: () => Toast.show({ type: 'info', text1: 'Coming soon' }),
        },
      ],
    },
    {
      title: 'PRIVACY & SECURITY',
      items: [
        {
          icon: <Lock color={COLORS.primary} size={20} />,
          label: 'Change Password',
          onPress: () => navigation.navigate('ChangePassword'),
        },
        {
          icon: <Trash2 color={COLORS.primary} size={20} />,
          label: 'Clear Search History',
          onPress: () => {
            if (!isAuthenticated) {
              Toast.show({ type: 'info', text1: 'Login required' });
              return;
            }
            Alert.alert('Clear History', 'Clear all your search history? This cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await apiClient.delete<any>('/auth/history');
                    Toast.show({ type: 'success', text1: 'History cleared' });
                  } catch (e: any) {
                    Toast.show({ type: 'error', text1: 'Failed to clear', text2: e?.message || 'Please try again' });
                  }
                },
              },
            ]);
          },
        },
        {
          icon: <Download color={COLORS.primary} size={20} />,
          label: 'Export My Data',
          onPress: async () => {
            if (!isAuthenticated) {
              Toast.show({ type: 'info', text1: 'Login required' });
              return;
            }
            try {
              const [wishlistRes, alertsRes, historyRes] = await Promise.all([
                apiClient.get<any>('/wishlist'),
                apiClient.get<any>('/alerts'),
                apiClient.get<any>('/auth/history'),
              ]);
              const exportData = {
                user,
                wishlist: wishlistRes?.wishlist || [],
                alerts: alertsRes?.alerts || [],
                history: historyRes?.history || [],
                exportedAt: new Date().toISOString(),
              };
              await Share.share({ message: JSON.stringify(exportData, null, 2) });
            } catch (e: any) {
              Toast.show({ type: 'error', text1: 'Export failed', text2: e?.message || 'Please try again' });
            }
          },
        },
        {
          icon: <Shield color={COLORS.error} size={20} />,
          label: 'Delete Account',
          onPress: () => {
            Alert.alert('Delete Account', 'This action cannot be undone. Are you sure you want to delete your account and all associated data?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: handleLogout,
              },
            ]);
          },
        },
      ],
    },
    {
      title: 'ABOUT',
      items: [
        {
          icon: <Info color={COLORS.primary} size={20} />,
          label: 'About BHAO.PK',
          value: 'Version 1.0.0',
          onPress: () => {
            Alert.alert(
              'About BHAO.PK',
              'BHAO.PK - Pakistan\'s Price Comparison Engine\n\nCompare prices across Daraz, Shophive, Telemart, Mega.pk, and PriceOye.\n\nVersion 1.0.0',
              [{ text: 'OK' }]
            );
          },
        },
        {
          icon: <Shield color={COLORS.primary} size={20} />,
          label: 'Privacy Policy',
          onPress: () => {
            Linking.openURL(`${WEBAPP_BASE}/privacy`).catch(() => {
              Toast.show({ type: 'info', text1: 'Privacy policy page not available yet' });
            });
          },
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h3">Settings</Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Typography
              variant="caption"
              color={COLORS.textSecondary}
              style={styles.sectionTitle}
            >
              {section.title}
            </Typography>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.settingItemLast,
                  ]}
                  onPress={item.onPress}
                  disabled={item.toggle}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>{item.icon}</View>
                    <View style={styles.settingText}>
                      <Typography>{item.label}</Typography>
                      {item.value && !item.toggle && (
                        <Typography variant="caption" color={COLORS.textSecondary}>
                          {String(item.value)}
                        </Typography>
                      )}
                    </View>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={!!item.value}
                      onValueChange={item.onToggle ? (v) => item.onToggle!(v) : undefined}
                      trackColor={{ false: COLORS.border, true: COLORS.primary }}
                      thumbColor={COLORS.surface}
                    />
                  ) : (
                    <ChevronRight color={COLORS.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout button */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Typography color={COLORS.error} style={{ fontWeight: '600' }}>Logout</Typography>
          </TouchableOpacity>
        )}
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
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.sm,
    letterSpacing: 2,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: SPACING.md,
  },
  settingText: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
});
