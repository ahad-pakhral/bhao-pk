import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { COLORS, SPACING } from '../theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Typography variant="h3" style={styles.title}>
        {title}
      </Typography>
      <Typography color={COLORS.textSecondary} style={styles.message}>
        {message}
      </Typography>
      {onAction && actionLabel && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: SPACING.xl * 2,
  },
  button: {
    paddingHorizontal: SPACING.xl * 2,
  },
});
