import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { Typography } from './Typography';
import { Button } from './Button';
import { COLORS, SPACING } from '../theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Please try again',
  onRetry,
  actionLabel = 'RETRY',
}) => {
  return (
    <View style={styles.container}>
      <AlertCircle color={COLORS.error} size={64} strokeWidth={1.5} />
      <Typography variant="h3" style={styles.title}>
        {title}
      </Typography>
      <Typography color={COLORS.textSecondary} style={styles.message}>
        {message}
      </Typography>
      {onRetry && (
        <Button
          title={actionLabel}
          onPress={onRetry}
          variant="outline"
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
  title: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  button: {
    paddingHorizontal: SPACING.xl * 2,
  },
});
