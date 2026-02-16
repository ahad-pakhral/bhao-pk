import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { ShieldCheck, Lock } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, Input, Button } from '../components';

export const AdminLoginScreen = ({ navigation }: any) => {
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('AdminDashboard');
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <ShieldCheck color={COLORS.primary} size={64} style={styles.icon} />
            <Typography variant="h1">Admin Access</Typography>
            <Typography color={COLORS.textSecondary} style={styles.subtitle}>
              Secure gateway for price engine management
            </Typography>
          </View>

          <View style={styles.form}>
            <Input
              label="Admin Security Key"
              placeholder="Enter security key"
              value={adminKey}
              onChangeText={setAdminKey}
              secureTextEntry
              icon={<Lock color={COLORS.textSecondary} size={20} />}
            />

            <Button 
              title="AUTHENTICATE" 
              onPress={handleAdminLogin} 
              loading={loading}
              style={styles.loginButton} 
            />

            <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
              <Typography color={COLORS.textSecondary}>Return to Profile</Typography>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  icon: {
    marginBottom: SPACING.lg,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  backLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
});
