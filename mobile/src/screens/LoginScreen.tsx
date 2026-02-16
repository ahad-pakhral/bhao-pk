import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, Input, Button, Logo } from '../components';
import { useAuth } from '../context/AuthContext';
import { validateForm, loginSchema } from '../utils/validation';
import { LoginScreenProps } from '../types/navigation';

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async () => {
    // Validate form
    const formData = { email, password };
    const validationErrors = validateForm(formData, loginSchema);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await login(email, password);
      navigation.replace('Main');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logo}><Logo size="lg" /></View>
            <Typography variant="h2">Welcome Back</Typography>
            <Typography color={COLORS.textSecondary}>Sign in to track prices and save big</Typography>
          </View>

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              icon={<Mail color={COLORS.textSecondary} size={20} />}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              secureTextEntry={!showPassword}
              icon={<Lock color={COLORS.textSecondary} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff color={COLORS.textSecondary} size={20} />
                  ) : (
                    <Eye color={COLORS.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
              error={errors.password}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Typography variant="caption" color={COLORS.primary}>FORGOT PASSWORD?</Typography>
            </TouchableOpacity>

            <Button
              title="LOGIN"
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
            />

            <Button
              title="CONTINUE AS GUEST"
              variant="outline"
              onPress={() => navigation.replace('Main')}
              style={styles.guestButton}
            />

            <View style={styles.footer}>
              <Typography color={COLORS.textSecondary}>Don't have an account? </Typography>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Typography color={COLORS.primary} style={styles.boldText}>SIGN UP</Typography>
              </TouchableOpacity>
            </View>
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
  },
  header: {
    marginBottom: SPACING.xl * 2,
  },
  logo: {
    marginBottom: SPACING.md,
    fontSize: 40,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.xl,
  },
  loginButton: {
    marginBottom: SPACING.md,
  },
  guestButton: {
    marginBottom: SPACING.xl,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  boldText: {
    fontFamily: 'Archivo_700Bold',
  },
});
