import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ArrowLeft, User, Mail, Phone, MapPin } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button } from '../components';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

export const EditProfileScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSave = () => {
    Toast.show({
      type: 'success',
      text1: 'Profile updated',
      text2: 'Your changes have been saved successfully',
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Typography variant="h3">Edit Profile</Typography>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User color={COLORS.background} size={48} />
          </View>
          <TouchableOpacity>
            <Typography color={COLORS.primary} style={styles.changePhotoText}>
              Change Photo
            </Typography>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
              FULL NAME
            </Typography>
            <View style={styles.inputWrapper}>
              <User color={COLORS.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
              EMAIL
            </Typography>
            <View style={styles.inputWrapper}>
              <Mail color={COLORS.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
              PHONE NUMBER
            </Typography>
            <View style={styles.inputWrapper}>
              <Phone color={COLORS.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+92 300 1234567"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Typography variant="caption" color={COLORS.textSecondary} style={styles.label}>
              ADDRESS
            </Typography>
            <View style={styles.inputWrapper}>
              <MapPin color={COLORS.textSecondary} size={20} />
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your address"
                placeholderTextColor={COLORS.textSecondary}
                multiline
              />
            </View>
          </View>
        </View>

        <Button
          title="SAVE CHANGES"
          onPress={handleSave}
          style={styles.saveButton}
        />
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
  scrollContent: {
    padding: SPACING.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  changePhotoText: {
    fontFamily: 'Archivo_600SemiBold',
  },
  formSection: {
    marginBottom: SPACING.xl,
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
    backgroundColor: COLORS.surface,
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
  saveButton: {
    marginTop: SPACING.xl,
  },
});
