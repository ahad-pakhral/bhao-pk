import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { ArrowLeft, Search, Clock } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography } from '../components';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api/client';
import Toast from 'react-native-toast-message';

export const SearchHistoryScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const [history, setHistory] = useState<Array<{ id: string; query: string; created_at: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const formatRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
  };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        setHistory([]);
        return;
      }
      const data = await apiClient.get<any>('/auth/history');
      setHistory((data?.history || []) as any[]);
    } catch (e: any) {
      console.warn('[History] Failed to load:', e?.message || e);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribe = navigation.addListener?.('focus', () => {
      loadHistory();
    });
    loadHistory();
    return unsubscribe;
  }, [navigation, loadHistory]);

  const clearAll = async () => {
    if (!isAuthenticated) return;
    Alert.alert('Clear History', 'Clear all your search history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete<any>('/auth/history');
            setHistory([]);
            Toast.show({ type: 'success', text1: 'History cleared' });
          } catch (e: any) {
            Toast.show({ type: 'error', text1: 'Failed to clear', text2: e?.message || 'Please try again' });
          }
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h3">Search History</Typography>
        {history.length > 0 ? (
          <TouchableOpacity onPress={clearAll}>
            <Typography variant="caption" color={COLORS.primary}>Clear All</Typography>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Typography variant="monoBold" color={COLORS.textSecondary} style={styles.sectionTitle}>
          RECENT SEARCHES
        </Typography>

        {!isAuthenticated ? (
          <View style={styles.emptyState}>
            <Search color={COLORS.textSecondary} size={64} strokeWidth={1} />
            <Typography variant="h3" style={styles.emptyTitle}>Login required</Typography>
            <Typography color={COLORS.textSecondary} style={styles.emptyText}>
              Login to view your search history.
            </Typography>
          </View>
        ) : loading ? (
          <View style={styles.emptyState}>
            <Typography color={COLORS.textSecondary}>Loading history...</Typography>
          </View>
        ) : history.map((item, index) => (
          <TouchableOpacity
            key={item.id || String(index)}
            style={styles.historyItem}
            onPress={() => navigation.navigate('Search', { query: item.query })}
          >
            <Clock color={COLORS.textSecondary} size={20} />
            <View style={styles.searchText}>
              <Typography numberOfLines={1}>{item.query}</Typography>
              <Typography variant="caption" color={COLORS.textSecondary}>
                {formatRelativeDate(item.created_at)}
              </Typography>
            </View>
          </TouchableOpacity>
        ))}

        {isAuthenticated && !loading && history.length === 0 && (
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
