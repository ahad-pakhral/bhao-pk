import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { ArrowLeft, Search, X, Clock } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography } from '../components';

export const SearchHistoryScreen = ({ navigation }: any) => {
  const [recentSearches, setRecentSearches] = useState([
    'iPhone 15',
    'MacBook Air',
    'AirPods Pro',
    'Samsung S24',
    'iPad Pro',
  ]);

  const clearAll = () => {
    setRecentSearches([]);
  };

  const removeSearch = (index: number) => {
    setRecentSearches(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h3">Search History</Typography>
        <TouchableOpacity onPress={clearAll}>
          <Typography variant="caption" color={COLORS.primary}>Clear All</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
          RECENT SEARCHES
        </Typography>

        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.historyItem}
            onPress={() => navigation.navigate('Search', { query: search })}
          >
            <Clock color={COLORS.textSecondary} size={20} />
            <Typography style={styles.searchText}>{search}</Typography>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeSearch(index)}
            >
              <X color={COLORS.textSecondary} size={16} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {recentSearches.length === 0 && (
          <View style={styles.emptyState}>
            <Search color={COLORS.textSecondary} size={64} strokeWidth={1} />
            <Typography variant="h3" style={styles.emptyTitle}>No search history</Typography>
            <Typography color={COLORS.textSecondary} style={styles.emptyText}>
              Your recent searches will appear here
            </Typography>
          </View>
        )}
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
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  emptyState: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
});
