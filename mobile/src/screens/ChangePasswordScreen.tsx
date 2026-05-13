import React, { useMemo, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { ArrowLeft, Lock } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { validatePassword } from '../utils/passwordValidation';

export const ChangePasswordScreen = ({ navigation }: any) => {
  const { isAuthenticated } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const validation = useMemo(() => validatePassword(password), [password]);

  const canSubmit = validation.isValid && confirmPassword.length > 0 && confirmPassword === password && !saving;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Toast.show({ type: 'info', text1: 'Login required' });
      navigation.navigate('Login');
      return;
    }

    if (!validation.isValid) {
      Toast.show({ type: 'error', text1: 'Weak password', text2: 'Please meet all requirements' });
      return;
    }

    if (confirmPassword !== password) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Toast.show({ type: 'success', text1: 'Password updated' });
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.message || 'Failed to update password';
      Alert.alert('Change Password', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h3">Change Password</Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
              NEW PASSWORD
            </Typography>
            <View style={styles.inputWrapper}>
              <Lock color={COLORS.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {password.length > 0 && (
            <View style={styles.rules}>
              {validation.rules.map((r) => (
                <Typography
                  key={r.label}
                  variant="caption"
                  color={r.met ? COLORS.success : COLORS.textSecondary}
                  style={styles.ruleRow}
                >
                  {r.met ? '✓' : '○'} {r.label}
                </Typography>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
              CONFIRM PASSWORD
            </Typography>
            <View style={styles.inputWrapper}>
              <Lock color={COLORS.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textSecondary}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            {confirmPassword.length > 0 && confirmPassword !== password ? (
              <Typography variant="caption" color={COLORS.error} style={{ marginTop: SPACING.xs }}>
                Passwords do not match
              </Typography>
            ) : null}
          </View>

          <Button title="UPDATE PASSWORD" onPress={handleSubmit} loading={saving} disabled={!canSubmit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  input: {
    flex: 1,
    marginLeft: SPACING.sm,
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Archivo_400Regular',
    paddingVertical: SPACING.xs,
  },
  rules: {
    marginBottom: SPACING.lg,
  },
  ruleRow: {
    marginBottom: 4,
  },
});

