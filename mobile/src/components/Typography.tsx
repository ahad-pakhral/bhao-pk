import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../theme';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'mono' | 'monoBold';
  color?: string;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = COLORS.text,
  children,
  style,
  numberOfLines,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'body':
        return styles.body;
      case 'bodySmall':
        return styles.bodySmall;
      case 'caption':
        return styles.caption;
      case 'mono':
        return styles.mono;
      case 'monoBold':
        return styles.monoBold;
      default:
        return styles.body;
    }
  };

  return (
    <Text
      style={[getVariantStyle(), { color }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  h1: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  h2: {
    fontFamily: FONTS.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: FONTS.medium,
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  mono: {
    fontFamily: FONTS.mono,
    fontSize: 14,
  },
  monoBold: {
    fontFamily: FONTS.monoBold,
    fontSize: 14,
  },
});
