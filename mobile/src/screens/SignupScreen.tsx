import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { COLORS, SPACING } from '../theme';
import { Typography, Input, Button, Logo } from '../components';
import { useAuth } from '../context/AuthContext';
import { validateForm, signupSchema } from '../utils/validation';
import { SignupScreenProps } from '../types/navigation';

export const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSignup = async () => {
    // Validate form
    const formData = { name, email, password, confirmPassword };
    const validationErrors = validateForm(formData, signupSchema);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await signup({ name, email, password });
      navigation.replace('Main');
    } catch (error) {
      console.error('Signup error:', error);
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logo}><Logo size="lg" /></View>
            <Typography variant="h2">Create Account</Typography>
            <Typography color={COLORS.textSecondary}>Join thousands of smart shoppers</Typography>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              icon={<User color={COLORS.textSecondary} size={20} />}
              error={errors.name}
            />

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
              placeholder="Create a password"
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

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              secureTextEntry={!showConfirmPassword}
              icon={<Lock color={COLORS.textSecondary} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff color={COLORS.textSecondary} size={20} />
                  ) : (
                    <Eye color={COLORS.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
              error={errors.confirmPassword}
            />

            <Typography variant="caption" color={COLORS.textSecondary} style={styles.terms}>
              By signing up, you agree to our <Typography variant="caption" color={COLORS.primary}>Terms of Service</Typography> and <Typography variant="caption" color={COLORS.primary}>Privacy Policy</Typography>.
            </Typography>

            <Button
              title="CREATE ACCOUNT"
              onPress={handleSignup}
              loading={loading}
              style={styles.signupButton}
            />

            <Button
              title="CONTINUE AS GUEST"
              variant="outline"
              onPress={() => navigation.replace('Main')}
              style={styles.guestButton}
            />

            <View style={styles.footer}>
              <Typography color={COLORS.textSecondary}>Already have an account? </Typography>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Typography color={COLORS.primary} style={styles.boldText}>LOGIN</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    padding: SPACING.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
  },
  logo: {
    marginBottom: SPACING.md,
    fontSize: 40,
  },
  form: {
    width: '100%',
  },
  terms: {
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  signupButton: {
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
