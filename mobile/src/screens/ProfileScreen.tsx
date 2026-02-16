import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { User, Settings, Heart, Bell, History, LogOut, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';

export const ProfileScreen = ({ navigation }: any) => {
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
        { text: 'Logout', style: 'destructive', onPress: () => navigation.replace('Login') }
      ]
    );
  };

  const menuItems = [
    { icon: <Heart color={COLORS.primary} size={20} />, title: 'Wishlist', subtitle: '3 items saved' },
    { icon: <Bell color={COLORS.primary} size={20} />, title: 'Price Alerts', subtitle: '2 active alerts' },
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
          <Typography variant="h2">Ahad Ali</Typography>
          <Typography color={COLORS.textSecondary}>ahad@example.com</Typography>
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
            <Typography variant="h3" color={COLORS.primary}>12</Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>TRACKED</Typography>
          </View>
          <View style={styles.statBox}>
            <Typography variant="h3" color={COLORS.primary}>5</Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>ALERTS</Typography>
          </View>
          <View style={styles.statBox}>
            <Typography variant="h3" color={COLORS.primary}>Rs. 15k</Typography>
            <Typography variant="caption" color={COLORS.textSecondary}>SAVED</Typography>
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

        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => Alert.alert('Admin Access', 'Admin features coming soon', [{ text: 'OK' }])}
          activeOpacity={0.7}
        >
          <ShieldCheck color={COLORS.textSecondary} size={20} />
          <Typography color={COLORS.textSecondary} style={{ marginLeft: SPACING.sm }}>
            Admin Access
          </Typography>
        </TouchableOpacity>

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
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    padding: SPACING.md,
  },
});
