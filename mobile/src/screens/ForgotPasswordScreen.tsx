import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, Input, Button, Logo } from '../components';
import { useAuth } from '../context/AuthContext';
import { validateForm, forgotPasswordSchema } from '../utils/validation';
import { ForgotPasswordScreenProps } from '../types/navigation';

export const ForgotPasswordScreen = ({ navigation }: ForgotPasswordScreenProps) => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async () => {
    // Validate form
    const formData = { email };
    const validationErrors = validateForm(formData, forgotPasswordSchema);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await forgotPassword(email);
      setEmailSent(true);
    } catch (error) {
      console.error('Forgot password error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <CheckCircle color={COLORS.success} size={64} />
            <Typography variant="h2" style={styles.successTitle}>Check Your Email</Typography>
            <Typography color={COLORS.textSecondary} style={styles.successMessage}>
              We've sent password reset instructions to {email}
            </Typography>
            <Button
              title="BACK TO LOGIN"
              onPress={() => navigation.navigate('Login')}
              style={styles.backButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logo}><Logo size="lg" /></View>
            <Typography variant="h2">Forgot Password?</Typography>
            <Typography color={COLORS.textSecondary}>
              Enter your email and we'll send you instructions to reset your password
            </Typography>
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

            <Button
              title="SEND RESET LINK"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => navigation.navigate('Login')}
            >
              <Typography color={COLORS.textSecondary}>
                Remember your password? <Typography color={COLORS.primary}>Login</Typography>
              </Typography>
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
  },
  backIconButton: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.xl,
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
  submitButton: {
    marginBottom: SPACING.xl,
  },
  backToLogin: {
    alignSelf: 'center',
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  successMessage: {
    textAlign: 'center',
    marginBottom: SPACING.xl * 2,
  },
  backButton: {
    paddingHorizontal: SPACING.xl * 2,
  },
});
