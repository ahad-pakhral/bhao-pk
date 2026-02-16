import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { LayoutDashboard, Database, RefreshCw, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';

export const AdminDashboardScreen = ({ navigation }: any) => {
  const stats = [
    { label: 'SCRAPED', value: '1.2M', icon: <Database color={COLORS.primary} size={20} /> },
    { label: 'UPTIME', value: '99.9%', icon: <RefreshCw color={COLORS.success} size={20} /> },
    { label: 'ALERTS', value: '24', icon: <AlertTriangle color={COLORS.warning} size={20} /> },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.replace('Main')}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h2">Admin Dashboard</Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                {stat.icon}
                <Typography variant="caption" color={COLORS.textSecondary} style={styles.statLabel}>
                  {stat.label}
                </Typography>
              </View>
              <Typography variant="h2" color={COLORS.primary}>{stat.value}</Typography>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Typography variant="monoBold" style={styles.sectionTitle}>SCRAPER STATUS</Typography>
          <View style={styles.scraperItem}>
            <Typography>Daraz.pk</Typography>
            <Typography color={COLORS.success}>ACTIVE</Typography>
          </View>
          <View style={styles.scraperItem}>
            <Typography>Telemart</Typography>
            <Typography color={COLORS.success}>ACTIVE</Typography>
          </View>
          <View style={styles.scraperItem}>
            <Typography>Shophive</Typography>
            <Typography color={COLORS.warning}>SLOW</Typography>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="monoBold" style={styles.sectionTitle}>SYSTEM CONTROLS</Typography>
          <Button title="RESTART SCRAPERS" onPress={() => {}} style={styles.controlButton} />
          <Button title="CLEAR CACHE" variant="secondary" onPress={() => {}} style={styles.controlButton} />
          <Button title="EXPORT ANALYTICS" variant="outline" onPress={() => {}} style={styles.controlButton} />
        </View>
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
  content: {
    padding: SPACING.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.xs,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statLabel: {
    marginLeft: SPACING.xs,
    letterSpacing: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    letterSpacing: 2,
    color: COLORS.textSecondary,
  },
  scraperItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  controlButton: {
    marginBottom: SPACING.md,
  },
});
