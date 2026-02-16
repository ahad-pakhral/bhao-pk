import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { COLORS, FONTS } from '../theme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true
}) => {
  const dimensions = {
    sm: 20,
    md: 28,
    lg: 40,
  };

  const fontSize = {
    sm: 16,
    md: 22,
    lg: 32,
  };

  const svgSize = dimensions[size];

  return (
    <View style={styles.container}>
      <Svg width={svgSize} height={svgSize * 1.22} viewBox="0 0 231 281">
        <G>
          <Path
            fill="#C5F608"
            d="M1123.57 411.971L1334.87 412.274C1387.88 412.301 1442.01 409.1 1493.56 419.706C1497.75 420.547 1505.55 421.901 1509.33 423.098C1519 425.009 1529.11 428.906 1538.33 432.523C1577.23 449.007 1606.57 472.606 1626.4 510.694C1629.33 517.111 1632.19 523.56 1634.99 530.04C1648.53 565.806 1648.55 619.095 1631.78 653.693C1624.52 668.661 1616.27 690.814 1598.81 694.45C1585.6 697.339 1572.46 700.543 1559.41 704.059C1538.78 709.542 1518.08 714.72 1497.3 719.593L1461.88 728.776L1404.61 744.297C1415.02 754.651 1432.37 766.337 1441.17 776.247C1448.8 782.665 1456.99 789.421 1463.81 796.676C1419.34 785.693 1358.92 793.654 1312.54 791.127C1303.09 790.612 1260.38 790.256 1252.59 791.941C1254.25 805.107 1253.27 846.26 1253.25 860.921C1240.02 878.947 1212.5 909.365 1197.15 927.756L1166.29 964.628C1162.71 968.949 1155.13 978.845 1151.74 982.167L1148.16 986.362C1143.02 993.865 1130.31 1008.19 1124.02 1015.7L1123.64 599.77C1123.73 538.063 1124.84 473.476 1123.57 411.971ZM1253.15 680.21L1365.01 680.309C1422.87 680.308 1497.8 687.623 1512.53 614.126C1516.29 571.289 1502.7 545.214 1461.87 529.379C1431.89 521.181 1397.01 522.747 1365.86 523.303C1328.88 523.964 1290.19 522.167 1253.46 523.86C1253.38 574.767 1254.43 629.672 1253.15 680.21Z"
            transform="matrix(0.373698 0 0 0.373698 -407.331 -149.853)"
          />
        </G>
      </Svg>
      {showText && (
        <Text style={[styles.text, { fontSize: fontSize[size] }]}>
          <Text style={styles.textBold}>HAO</Text>
          <Text style={styles.textMuted}>.PK</Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontFamily: 'Archivo_900Black',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  textBold: {
    fontFamily: 'Archivo_900Black',
    color: COLORS.text,
  },
  textMuted: {
    fontFamily: 'Archivo_400Regular',
    color: '#666',
  },
});
