import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Dimensions, Modal, TextInput } from 'react-native';
import { ArrowLeft, Share2, Heart, ExternalLink, TrendingDown, X, Bell } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button, PriceHistoryChart } from '../components';
import { useWishlist } from '../hooks/useWishlist';
import { smartAlertsStorage } from '../services/storage.service';
import { createSmartAlert } from '../utils/smartAlerts';
import { ALL_PRODUCTS } from '../constants/dummyData';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<'every' | 'specific' | null>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const { isInWishlist, toggleWishlist } = useWishlist();

  const { product } = route.params || {
    product: {
      name: 'iPhone 15 Pro',
      price: 'Rs. 345,000',
      store: 'Daraz.pk',
      rating: 4.9,
      reviewsCount: 120,
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=400',
      specs: '256GB • 5G • Natural Titanium',
      features: [
        { key: 'Display', value: '6.1" Super Retina XDR' },
        { key: 'Processor', value: 'A17 Pro chip' },
        { key: 'Camera', value: '48MP Main | Ultra Wide | Telephoto' },
        { key: 'Battery', value: 'Up to 23 hours video playback' },
      ],
      reviews: [
        { user: 'Ali Khan', rating: 5, comment: 'Best phone I\'ve ever used. The titanium finish is amazing and it\'s so light!' },
        { user: 'Sara Ahmed', rating: 4.5, comment: 'Great performance but battery life could be better. Camera is top notch though.' },
      ]
    }
  };

  const saveSmartAlert = async (alertType: 'every_change' | 'target_price', tPrice?: number) => {
    const smartAlert = createSmartAlert(product, alertType, tPrice, ALL_PRODUCTS);
    await smartAlertsStorage.addAlert(smartAlert);
  };

  const handleSetAlert = async (type: 'every' | 'specific') => {
    setAlertType(type);
    if (type === 'every') {
      await saveSmartAlert('every_change');
      setShowAlertModal(false);
      setAlertType(null);
      Toast.show({
        type: 'success',
        text1: 'Smart Alert Set!',
        text2: `Tracking ${product.name} across all stores`,
      });
    }
  };

  const handleSpecificPriceSubmit = async () => {
    setPriceError('');

    if (!targetPrice || targetPrice.trim() === '') {
      setPriceError('Please enter a target price');
      return;
    }

    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setPriceError('Please enter a valid price greater than 0');
      return;
    }

    await saveSmartAlert('target_price', price);
    setShowAlertModal(false);
    setAlertType(null);
    setTargetPrice('');
    Toast.show({
      type: 'success',
      text1: 'Smart Alert Set!',
      text2: `Tracking across stores — target Rs. ${price.toLocaleString()}`,
    });
  };

  // Mock price history data (last 30 days)
  const priceHistory = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const basePrice = 345000;
    const variation = Math.sin(i / 5) * 15000 + Math.random() * 5000;
    return {
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      price: Math.round(basePrice + variation),
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Share2 color={COLORS.text} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => toggleWishlist(product.id)}>
            <Heart
              color={isInWishlist(product.id) ? COLORS.error : COLORS.text}
              fill={isInWishlist(product.id) ? COLORS.error : 'transparent'}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
        
        <View style={styles.infoSection}>
          <View style={styles.storeRow}>
            <Typography variant="bodySmall" color={COLORS.textSecondary}>{product.store}</Typography>
            <Typography color={COLORS.primary}>★ {product.rating}</Typography>
          </View>

          <Typography variant="h1" style={styles.name}>{product.name}</Typography>
          <Typography variant="body" color={COLORS.textSecondary} style={styles.specs}>{product.specs}</Typography>

          <View style={styles.priceContainer}>
            <View>
              <Typography variant="caption" color={COLORS.textSecondary}>CURRENT PRICE</Typography>
              <Typography variant="h1" color={COLORS.primary}>{product.price}</Typography>
            </View>
            <View style={styles.priceDrop}>
              <TrendingDown color={COLORS.success} size={20} />
              <Typography color={COLORS.success} variant="monoBold"> -5%</Typography>
            </View>
          </View>

          <View style={styles.priceHistorySection}>
            <Typography variant="monoBold" style={styles.sectionTitle}>PRICE HISTORY (30 DAYS)</Typography>
            <PriceHistoryChart data={priceHistory} />
          </View>

          <View style={styles.actions}>
            <Button
              title="GO TO STORE"
              onPress={() => {}}
              style={styles.mainButton}
              icon={<ExternalLink size={20} color={COLORS.background} />}
            />
            <Button
              title="SET PRICE ALERT"
              variant="outline"
              onPress={() => setShowAlertModal(true)}
              style={styles.trackButton}
            />
          </View>

          <View style={styles.featuresSection}>
            <Typography variant="monoBold" style={styles.sectionTitle}>FEATURES</Typography>
            {product.features?.map((feature: any, index: number) => (
              <View key={index} style={styles.featureItem}>
                <Typography variant="bodySmall" color={COLORS.textSecondary}>{feature.key}</Typography>
                <Typography variant="bodySmall" style={{ fontWeight: '600' }}>{feature.value}</Typography>
              </View>
            ))}
          </View>

          <View style={styles.reviewsSection}>
            <Typography variant="monoBold" style={styles.sectionTitle}>
              USER REVIEWS ({product.reviewsCount || 0})
            </Typography>
            {product.reviews?.map((review: any, index: number) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Typography variant="bodySmall" style={{ fontWeight: '700' }}>{review.user}</Typography>
                  <Typography color={COLORS.primary}>★ {review.rating}</Typography>
                </View>
                <Typography variant="bodySmall" color={COLORS.textSecondary} style={{ lineHeight: 20 }}>
                  {review.comment}
                </Typography>
              </View>
            ))}
            <Button title="VIEW ALL REVIEWS" variant="outline" onPress={() => {}} style={{ marginTop: SPACING.md }} />
          </View>
        </View>
      </ScrollView>

      {/* Price Alert Modal */}
      <Modal
        visible={showAlertModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAlertModal(false);
          setAlertType(null);
          setTargetPrice('');
          setPriceError('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="h3">Set Price Alert</Typography>
              <TouchableOpacity
                onPress={() => {
                  setShowAlertModal(false);
                  setAlertType(null);
                  setTargetPrice('');
                  setPriceError('');
                }}
              >
                <X color={COLORS.text} size={24} />
              </TouchableOpacity>
            </View>

            {alertType === null ? (
              <View style={styles.modalBody}>
                <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.xl }}>
                  Choose how you'd like to be notified about price changes for {product.name}
                </Typography>

                <TouchableOpacity
                  style={styles.alertOption}
                  onPress={() => handleSetAlert('every')}
                  activeOpacity={0.7}
                >
                  <View style={styles.alertOptionIcon}>
                    <Bell color={COLORS.primary} size={24} />
                  </View>
                  <View style={styles.alertOptionText}>
                    <Typography variant="body" style={{ fontWeight: '700', marginBottom: 4 }}>
                      Every Price Change
                    </Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Get notified whenever the price changes
                    </Typography>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.alertOption}
                  onPress={() => handleSetAlert('specific')}
                  activeOpacity={0.7}
                >
                  <View style={styles.alertOptionIcon}>
                    <Bell color={COLORS.primary} size={24} />
                  </View>
                  <View style={styles.alertOptionText}>
                    <Typography variant="body" style={{ fontWeight: '700', marginBottom: 4 }}>
                      Specific Price
                    </Typography>
                    <Typography variant="caption" color={COLORS.textSecondary}>
                      Set a target price and get notified when reached
                    </Typography>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.md }}>
                  Enter your target price
                </Typography>

                <TextInput
                  style={[styles.priceInput, priceError ? styles.priceInputError : null]}
                  placeholder="e.g., 300000"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                  value={targetPrice}
                  onChangeText={(text) => {
                    setTargetPrice(text);
                    setPriceError('');
                  }}
                  autoFocus
                />

                {priceError ? (
                  <Typography variant="caption" color={COLORS.error} style={{ marginTop: SPACING.xs }}>
                    {priceError}
                  </Typography>
                ) : null}

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setAlertType(null);
                      setTargetPrice('');
                      setPriceError('');
                    }}
                  >
                    <Typography color={COLORS.text}>Back</Typography>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSpecificPriceSubmit}
                  >
                    <Typography color={COLORS.background}>Set Alert</Typography>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  },
  headerActions: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: SPACING.md,
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  content: {
    paddingBottom: SPACING.xl,
  },
  productImage: {
    width: width,
    height: width * 0.75,
    resizeMode: 'cover',
    backgroundColor: '#1a1a1a',
  },
  infoSection: {
    padding: SPACING.lg,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  name: {
    marginBottom: SPACING.sm,
  },
  specs: {
    marginBottom: SPACING.lg,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  priceDrop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priceHistorySection: {
    marginBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  mainButton: {
    flex: 2,
  },
  trackButton: {
    flex: 1,
  },
  featuresSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  reviewsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
  },
  sectionTitle: {
    marginBottom: SPACING.md,
    letterSpacing: 2,
  },
  featureItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  alertOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  alertOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  alertOptionText: {
    flex: 1,
  },
  priceInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text,
    fontFamily: 'Archivo_400Regular',
    fontSize: 16,
  },
  priceInputError: {
    borderColor: COLORS.error,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
});
