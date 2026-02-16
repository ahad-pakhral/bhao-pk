import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { User, Bell, Moon, Globe, Shield, Info, ChevronRight, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography } from '../components';
import { useAuth } from '../context/AuthContext';

export const SettingsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(true);

  const settingSections = [
    {
      title: 'ACCOUNT',
      items: [
        {
          icon: <User color={COLORS.primary} size={20} />,
          label: 'Profile Information',
          value: user?.name || 'Guest',
          onPress: () => {},
        },
        {
          icon: <Bell color={COLORS.primary} size={20} />,
          label: 'Notifications',
          toggle: true,
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
      ],
    },
    {
      title: 'PREFERENCES',
      items: [
        {
          icon: <Moon color={COLORS.primary} size={20} />,
          label: 'Dark Mode',
          toggle: true,
          value: darkModeEnabled,
          onToggle: setDarkModeEnabled,
        },
        {
          icon: <Globe color={COLORS.primary} size={20} />,
          label: 'Language',
          value: 'English',
          onPress: () => {},
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
          onPress: () => {},
        },
        {
          icon: <Shield color={COLORS.primary} size={20} />,
          label: 'Privacy Policy',
          onPress: () => {},
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
                          {item.value}
                        </Typography>
                      )}
                    </View>
                  </View>
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
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
});
