import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Dimensions, Modal, TextInput, Linking, KeyboardAvoidingView, Platform } from 'react-native';
import { ArrowLeft, Heart, ExternalLink, TrendingDown, TrendingUp, X, Bell, Target, Check, Star, Package } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';
import { Typography, Button, PriceHistoryChart } from '../components';
import { useWishlist } from '../hooks/useWishlist';
import { apiClient } from '../services/api/client';
import { useAlerts } from '../hooks/useAlerts';
import { useAuth } from '../context/AuthContext';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertType, setAlertType] = useState<null | 'every' | 'specific'>(null);
  const [targetPrice, setTargetPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [alertLoading, setAlertLoading] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Array<{ date: string; price: number }>>([]);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { createAlert } = useAlerts();
  const { isAuthenticated } = useAuth();

  const baseProduct = route?.params?.product;
  const [detail, setDetail] = useState<any>(null);

  const handleEveryPriceChange = async () => {
    const productUrl = baseProduct?.url || '';
    if (!productUrl) {
      Toast.show({ type: 'error', text1: 'Product URL missing' });
      return;
    }
    if (priceValue <= 0) {
      Toast.show({ type: 'error', text1: 'Price not detected', text2: 'Wait for product to load or try again' });
      return;
    }

    setAlertLoading(true);
    try {
      const everyTargetPrice = Math.round(priceValue * 0.99);
      await createAlert({ productUrl, targetPrice: everyTargetPrice });
      setShowAlertModal(false);
      setAlertType(null);
      Toast.show({
        type: 'success',
        text1: 'Alert set!',
        text2: 'You\'ll be notified on every price change',
      });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to set alert', text2: e?.message || 'Please try again' });
    } finally {
      setAlertLoading(false);
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

    const url = baseProduct?.url || '';
    if (!url) {
      setPriceError('Missing product URL');
      return;
    }

    setAlertLoading(true);
    try {
      await createAlert({ productUrl: url, targetPrice: price });
      setShowAlertModal(false);
      setAlertType(null);
      setTargetPrice('');
      Toast.show({
        type: 'success',
        text1: 'Alert set!',
        text2: `Target Rs. ${price.toLocaleString()}`,
      });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to set alert', text2: e?.message || 'Please try again' });
    } finally {
      setAlertLoading(false);
    }
  };

  const inferStoreFromUrl = (url: string): string | null => {
    const lower = (url || '').toLowerCase();
    if (lower.includes('daraz')) return 'daraz';
    if (lower.includes('shophive')) return 'shophive';
    if (lower.includes('telemart')) return 'telemart';
    if (lower.includes('mega.pk')) return 'mega';
    if (lower.includes('priceoye')) return 'priceoye';
    return null;
  };

  const parsePriceNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    const n = parseInt(String(value || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizeStoreKey = (store: any, url: string): string | null => {
    const s = String(store || '').toLowerCase();
    if (s.includes('daraz')) return 'daraz';
    if (s.includes('shophive')) return 'shophive';
    if (s.includes('telemart')) return 'telemart';
    if (s.includes('mega')) return 'mega';
    if (s.includes('priceoye')) return 'priceoye';
    return url ? inferStoreFromUrl(url) : null;
  };

  const formatStoreLabel = (key: string | null): string => {
    if (!key) return 'Unknown';
    switch (key) {
      case 'daraz': return 'Daraz';
      case 'shophive': return 'Shophive';
      case 'telemart': return 'Telemart';
      case 'mega': return 'Mega';
      case 'priceoye': return 'PriceOye';
      default: return key;
    }
  };

  const url = String(baseProduct?.url || '');
  const storeKey = normalizeStoreKey(baseProduct?.store, url);
  const name = String(detail?.name || baseProduct?.name || '');
  const imageUrl: string | null = (detail?.imageUrl || baseProduct?.image || baseProduct?.imageUrl || null) as any;

  const priceValue =
    typeof detail?.price === 'number'
      ? detail.price
      : parsePriceNumber(baseProduct?.priceValue ?? baseProduct?.price);

  const originalPriceValue = parsePriceNumber(detail?.originalPrice ?? baseProduct?.originalPrice);
  const hasDiscount = originalPriceValue > 0 && originalPriceValue > priceValue;
  const discountPct = hasDiscount ? Math.round((1 - priceValue / originalPriceValue) * 100) : 0;

  const priceLabel =
    priceValue > 0 ? `Rs. ${Math.round(priceValue).toLocaleString()}` : String(baseProduct?.price || 'Rs. -');

  const historyDeltaPct = (() => {
    if (priceHistory.length < 2) return null;
    const first = priceHistory[0]?.price || 0;
    const last = priceHistory[priceHistory.length - 1]?.price || 0;
    if (first <= 0 || last <= 0) return null;
    return ((last - first) / first) * 100;
  })();

  const rating = typeof detail?.rating === 'number' ? detail.rating : (typeof baseProduct?.rating === 'number' ? baseProduct.rating : 0);
  const reviewsCount = detail?.reviewsCount || baseProduct?.reviewsCount || 0;
  const inStock = detail?.inStock !== false && baseProduct?.inStock !== false;

  // Load live product detail (description/specs/reviews) when possible.
  useEffect(() => {
    if (!url || !storeKey) {
      setDetail(null);
      return;
    }
    apiClient
      .get<any>(`/search/product?url=${encodeURIComponent(url)}&store=${encodeURIComponent(storeKey)}`)
      .then((data) => setDetail(data?.product || data))
      .catch(() => setDetail(null));
  }, [url, storeKey]);

  // Fetch cross-store matches for comparison (best-effort).
  useEffect(() => {
    if (!url || !storeKey || !name) {
      setMatchedProducts([]);
      return;
    }

    setMatchesLoading(true);
    apiClient
      .get<any>(
        `/search/matches?url=${encodeURIComponent(url)}&store=${encodeURIComponent(storeKey)}&name=${encodeURIComponent(name)}`
      )
      .then((data) => {
        const matches = Array.isArray(data?.matches) ? data.matches : [];
        setMatchedProducts(matches);
      })
      .catch(() => setMatchedProducts([]))
      .finally(() => setMatchesLoading(false));
  }, [url, storeKey, name]);

  // Record "recently viewed" (best-effort).
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!url || !storeKey || !name) return;
    apiClient
      .post<any>('/recently-viewed', { productUrl: url, store: storeKey, name, imageUrl })
      .catch(() => {});
  }, [isAuthenticated, url, storeKey, name, imageUrl]);

  useEffect(() => {
    if (!url || !storeKey) {
      setPriceHistory([]);
      return;
    }

    apiClient
      .get<any>(`/history?url=${encodeURIComponent(url)}&store=${encodeURIComponent(storeKey)}`)
      .then((data) => {
        const points = Array.isArray(data?.points) ? data.points : [];
        const normalized = points
          .filter((p: any) => p && typeof p.price === 'number' && (p.day || p.date))
          .map((p: any) => ({ date: String(p.day || p.date), price: Number(p.price) }));

        if (normalized.length > 0) {
          setPriceHistory(normalized);
          return;
        }

        const dayStr = new Date().toISOString().slice(0, 10);
        const priceNum = priceValue;
        setPriceHistory(priceNum > 0 ? [{ date: dayStr, price: priceNum }] : []);
      })
      .catch(() => {
        setPriceHistory([]);
      });
  }, [url, storeKey, priceValue]);

  if (!baseProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft color={COLORS.text} size={24} />
          </TouchableOpacity>
          <View />
        </View>
        <View style={styles.infoSection}>
          <Typography variant="h3">Product not available</Typography>
          <Typography color={COLORS.textSecondary} style={{ marginTop: SPACING.sm }}>
            Please open this product from Search, Trending, Wishlist, or Alerts.
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft color={COLORS.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={async () => {
              if (!url || !name) {
                Toast.show({ type: 'error', text1: 'Cannot add to wishlist', text2: 'Product data missing' });
                return;
              }
              if (!isAuthenticated) {
                Toast.show({ type: 'info', text1: 'Login required', text2: 'Please login to use wishlist' });
                return;
              }
              try {
                await toggleWishlist({ url, store: storeKey || String(baseProduct?.store || ''), name, imageUrl });
              } catch (e: any) {
                Toast.show({ type: 'error', text1: 'Wishlist error', text2: e?.message || 'Please try again' });
              }
            }}
          >
            <Heart
              color={isInWishlist(url) ? COLORS.error : COLORS.text}
              fill={isInWishlist(url) ? COLORS.error : 'transparent'}
              size={20}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="contain"
              resizeMethod="resize"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Package color={COLORS.textSecondary} size={48} />
            </View>
          )}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Typography variant="caption" color={COLORS.background} style={{ fontWeight: '700' }}>
                -{discountPct}%
              </Typography>
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          {/* Store badge + Rating + In Stock */}
          <View style={styles.storeRow}>
            <View style={styles.storeBadges}>
              <Typography variant="caption" color={COLORS.textSecondary} style={styles.storeBadge}>
                {String(detail?.store || baseProduct?.store || '').toUpperCase()}
              </Typography>
              {inStock && (
                <View style={styles.inStockBadge}>
                  <Check color={COLORS.success} size={12} />
                  <Typography variant="caption" color={COLORS.success} style={{ marginLeft: 2 }}>In Stock</Typography>
                </View>
              )}
            </View>
            {rating > 0 && (
              <View style={styles.ratingRow}>
                <Star color="#FFB800" size={14} fill="#FFB800" />
                <Typography variant="caption" color={COLORS.textSecondary}>
                  {rating.toFixed(1)} ({reviewsCount})
                </Typography>
              </View>
            )}
          </View>

          <Typography variant="h1" style={styles.name}>{name}</Typography>

          {/* Price section */}
          <View style={styles.priceContainer}>
            <View>
              <Typography variant="caption" color={COLORS.textSecondary}>CURRENT PRICE</Typography>
              <Typography variant="h1" color={COLORS.primary}>{priceLabel}</Typography>
              {hasDiscount && (
                <View style={styles.discountRow}>
                  <Typography variant="bodySmall" color={COLORS.textSecondary} style={{ textDecorationLine: 'line-through' }}>
                    Rs. {originalPriceValue.toLocaleString()}
                  </Typography>
                  <Typography variant="bodySmall" color={COLORS.error} style={{ fontWeight: '700' }}>
                    Save Rs. {(originalPriceValue - priceValue).toLocaleString()}
                  </Typography>
                </View>
              )}
            </View>
            {historyDeltaPct !== null ? (
              <View style={styles.priceDrop}>
                {historyDeltaPct <= 0 ? (
                  <TrendingDown color={COLORS.success} size={20} />
                ) : (
                  <TrendingUp color={COLORS.error} size={20} />
                )}
                <Typography color={historyDeltaPct <= 0 ? COLORS.success : COLORS.error} variant="monoBold">
                  {' '}
                  {(historyDeltaPct > 0 ? '+' : '') + historyDeltaPct.toFixed(1) + '%'}
                </Typography>
              </View>
            ) : null}
          </View>

          <View style={styles.priceHistorySection}>
            <Typography variant="monoBold" style={styles.sectionTitle}>PRICE HISTORY (30 DAYS)</Typography>
            <PriceHistoryChart data={priceHistory} />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="GO TO STORE"
              onPress={async () => {
                if (!url) return;
                try {
                  const supported = await Linking.canOpenURL(url);
                  if (supported) {
                    await Linking.openURL(url);
                  } else {
                    Toast.show({ type: 'error', text1: 'Cannot open this link' });
                  }
                } catch {
                  Toast.show({ type: 'error', text1: 'Failed to open link' });
                }
              }}
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

          {/* Compare Prices */}
          {(matchesLoading || matchedProducts.length > 0) ? (
          <View style={styles.matchesSection}>
            <Typography variant="monoBold" style={styles.sectionTitle}>COMPARE PRICES</Typography>

            {matchesLoading ? (
              <Typography variant="caption" color={COLORS.textSecondary}>
                Loading comparisons...
              </Typography>
            ) : (
              (() => {
                const prices = matchedProducts
                  .map((p: any) => (typeof p?.price === 'number' ? p.price : parsePriceNumber(p?.price)))
                  .filter((n: number) => Number.isFinite(n) && n > 0);
                const bestPrice = prices.length > 0 ? Math.min(...prices) : null;

                return matchedProducts.slice(0, 6).map((p: any, idx: number) => {
                  const pPrice = typeof p?.price === 'number' ? p.price : parsePriceNumber(p?.price);
                  const store = formatStoreLabel(normalizeStoreKey(p?.store, p?.url || '') || String(p?.store || ''));
                  const isBest = bestPrice !== null && pPrice > 0 && pPrice === bestPrice;
                  return (
                    <View key={`${p?.url || 'match'}-${idx}`} style={[styles.vendorCard, isBest && styles.vendorBest]}>
                      {isBest ? (
                        <View style={styles.bestBadge}>
                          <Typography variant="caption" color={COLORS.background} style={{ fontWeight: '700' }}>
                            BEST VALUE
                          </Typography>
                        </View>
                      ) : null}
                      <View style={styles.vendorHeader}>
                        <Typography variant="caption" color={COLORS.textSecondary} style={{ letterSpacing: 1, fontWeight: '700' }}>
                          {store}
                        </Typography>
                        {p?.inStock === false ? (
                          <Typography variant="caption" color={COLORS.error}>
                            Out of Stock
                          </Typography>
                        ) : null}
                      </View>
                      <Typography numberOfLines={2} style={{ marginTop: 6, marginBottom: 10 }}>
                        {String(p?.name || '')}
                      </Typography>
                      <Typography variant="h3" color={COLORS.primary} style={{ marginBottom: 10 }}>
                        {pPrice > 0 ? `Rs. ${Math.round(pPrice).toLocaleString()}` : 'Price unavailable'}
                      </Typography>
                      <Button
                        title={`VISIT ${store.toUpperCase()}`}
                        size="sm"
                        variant="outline"
                        onPress={() => {
                          const link = String(p?.url || '');
                          if (!link) return;
                          Linking.openURL(link).catch(() => {});
                        }}
                      />
                    </View>
                  );
                });
              })()
            )}
          </View>
          ) : null}

          {/* Product Details Grid */}
          <View style={styles.detailsSection}>
            <Typography variant="monoBold" style={styles.sectionTitle}>PRODUCT DETAILS</Typography>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Typography variant="bodySmall" color={COLORS.textSecondary}>Store</Typography>
                <Typography variant="bodySmall" style={{ fontWeight: '600' }}>
                  {String(detail?.store || baseProduct?.store || '')}
                </Typography>
              </View>
              <View style={styles.detailRow}>
                <Typography variant="bodySmall" color={COLORS.textSecondary}>Price</Typography>
                <Typography variant="bodySmall" color={COLORS.primary} style={{ fontWeight: '700', fontFamily: 'JetBrainsMono_700Bold' }}>
                  {priceLabel}
                </Typography>
              </View>
              {hasDiscount && (
                <>
                  <View style={styles.detailRow}>
                    <Typography variant="bodySmall" color={COLORS.textSecondary}>Original Price</Typography>
                    <Typography variant="bodySmall" color={COLORS.textSecondary} style={{ textDecorationLine: 'line-through' }}>
                      Rs. {originalPriceValue.toLocaleString()}
                    </Typography>
                  </View>
                  <View style={styles.detailRow}>
                    <Typography variant="bodySmall" color={COLORS.textSecondary}>You Save</Typography>
                    <Typography variant="bodySmall" color={COLORS.error} style={{ fontWeight: '700' }}>
                      Rs. {(originalPriceValue - priceValue).toLocaleString()} ({discountPct}%)
                    </Typography>
                  </View>
                </>
              )}
              {rating > 0 && (
                <View style={styles.detailRow}>
                  <Typography variant="bodySmall" color={COLORS.textSecondary}>Rating</Typography>
                  <Typography variant="bodySmall" color="#FFB800" style={{ fontWeight: '600' }}>
                    {rating.toFixed(1)} out of 5 ({reviewsCount} reviews)
                  </Typography>
                </View>
              )}
              <View style={styles.detailRow}>
                <Typography variant="bodySmall" color={COLORS.textSecondary}>Availability</Typography>
                <Typography variant="bodySmall" color={inStock ? COLORS.success : COLORS.error} style={{ fontWeight: '600' }}>
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </Typography>
              </View>
            </View>
          </View>

          {/* Description */}
          {detail?.description ? (
            <View style={styles.featuresSection}>
              <Typography variant="monoBold" style={styles.sectionTitle}>DESCRIPTION</Typography>
              <Typography variant="bodySmall" color={COLORS.textSecondary} style={{ lineHeight: 20 }}>
                {String(detail.description).trim()}
              </Typography>
            </View>
          ) : null}

          {/* Specs */}
          {Array.isArray(detail?.specs) && detail.specs.length > 0 ? (
            <View style={styles.featuresSection}>
              <Typography variant="monoBold" style={styles.sectionTitle}>SPECIFICATIONS</Typography>
              {detail.specs.slice(0, 12).map((spec: any, index: number) => (
                <View key={`${spec?.key || 'spec'}-${index}`} style={styles.featureItem}>
                  <Typography variant="bodySmall" color={COLORS.textSecondary}>{String(spec?.key || '')}</Typography>
                  <Typography variant="bodySmall" style={{ fontWeight: '600' }}>{String(spec?.value || '')}</Typography>
                </View>
              ))}
            </View>
          ) : null}

          {/* Reviews */}
          {Array.isArray(detail?.reviews) && detail.reviews.length > 0 ? (
            <View style={styles.reviewsSection}>
              <Typography variant="monoBold" style={styles.sectionTitle}>
                USER REVIEWS ({detail.reviewsCount || detail.reviews.length})
              </Typography>
              {detail.reviews.slice(0, 3).map((review: any, index: number) => (
                <View key={`${review?.author || 'review'}-${index}`} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Typography variant="bodySmall" style={{ fontWeight: '700' }}>{String(review?.author || 'User')}</Typography>
                    <View style={styles.reviewRatingRow}>
                      {typeof review?.rating === 'number' && (
                        <>
                          <Star color="#FFB800" size={12} fill="#FFB800" />
                          <Typography variant="caption" color={COLORS.textSecondary}>{review.rating}</Typography>
                        </>
                      )}
                      {review?.date ? (
                        <Typography variant="caption" color={COLORS.textSecondary}>{String(review.date)}</Typography>
                      ) : null}
                    </View>
                  </View>
                  <Typography variant="bodySmall" color={COLORS.textSecondary} style={{ lineHeight: 20 }}>
                    {String(review?.text || '').trim()}
                  </Typography>
                </View>
              ))}
            </View>
          ) : null}

          {/* View on Store */}
          {url && (
            <View style={styles.viewOnStore}>
              <View style={{ flex: 1 }}>
                <Typography style={{ fontWeight: '600', marginBottom: 4 }}>
                  View full details on {String(detail?.store || baseProduct?.store || 'the store')}
                </Typography>
                <Typography variant="caption" color={COLORS.textSecondary}>
                  See the complete product page with all specifications and reviews.
                </Typography>
              </View>
              <TouchableOpacity
                style={styles.viewOnStoreButton}
                onPress={() => Linking.openURL(url).catch(() => {})}
              >
                <ExternalLink size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          )}
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Typography variant="h3">
                  {alertType === null
                    ? 'Set Price Alert'
                    : alertType === 'every'
                      ? 'Every Price Change'
                      : 'Specific Price'}
                </Typography>
                <TouchableOpacity
                  onPress={() => {
                    if (alertType !== null) {
                      setAlertType(null);
                      setTargetPrice('');
                      setPriceError('');
                    } else {
                      setShowAlertModal(false);
                      setAlertType(null);
                      setTargetPrice('');
                      setPriceError('');
                    }
                  }}
                >
                  <X color={COLORS.text} size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {alertType === null ? (
                  <>
                    <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.md }}>
                      How would you like to be notified for {name || 'this product'}?
                    </Typography>

                    <TouchableOpacity style={styles.alertOption} onPress={() => setAlertType('every')}>
                      <View style={[styles.alertOptionIcon, { backgroundColor: `${COLORS.primary}20` }]}>
                        <Bell color={COLORS.primary} size={22} />
                      </View>
                      <View style={styles.alertOptionText}>
                        <Typography variant="body" style={{ fontWeight: '700' }}>Every Price Change</Typography>
                        <Typography variant="caption" color={COLORS.textSecondary}>
                          Get notified whenever the price changes
                        </Typography>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.alertOption} onPress={() => setAlertType('specific')}>
                      <View style={[styles.alertOptionIcon, { backgroundColor: `${COLORS.success}20` }]}>
                        <Target color={COLORS.success} size={22} />
                      </View>
                      <View style={styles.alertOptionText}>
                        <Typography variant="body" style={{ fontWeight: '700' }}>Specific Price</Typography>
                        <Typography variant="caption" color={COLORS.textSecondary}>
                          Get notified when price drops to a target
                        </Typography>
                      </View>
                    </TouchableOpacity>
                  </>
                ) : alertType === 'every' ? (
                  <>
                    <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.md }}>
                      You'll be notified every time the price of {name || 'this product'} changes.
                    </Typography>

                    <View style={styles.alertConfirmCard}>
                      <Typography variant="caption" color={COLORS.textSecondary}>Current Price</Typography>
                      <Typography variant="h3" color={COLORS.primary}>{priceLabel}</Typography>
                      <Typography variant="caption" color={COLORS.textSecondary} style={{ marginTop: SPACING.xs }}>
                        Any price change will trigger a notification
                      </Typography>
                    </View>

                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setAlertType(null);
                          setTargetPrice('');
                          setPriceError('');
                        }}
                        disabled={alertLoading}
                      >
                        <Typography color={COLORS.text}>Back</Typography>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.submitButton, alertLoading && { opacity: 0.6 }]}
                        onPress={handleEveryPriceChange}
                        disabled={alertLoading}
                      >
                        <Typography color={COLORS.background}>
                          {alertLoading ? 'Setting alert...' : 'Set Alert'}
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Typography variant="body" color={COLORS.textSecondary} style={{ marginBottom: SPACING.md }}>
                      Notify me when {name || 'this product'} drops to or below:
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
                        disabled={alertLoading}
                      >
                        <Typography color={COLORS.text}>Back</Typography>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.submitButton, alertLoading && { opacity: 0.6 }]}
                        onPress={handleSpecificPriceSubmit}
                        disabled={alertLoading}
                      >
                        <Typography color={COLORS.background}>
                          {alertLoading ? 'Setting alert...' : 'Set Alert'}
                        </Typography>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  imageContainer: {
    position: 'relative',
    width: width,
    height: width * 0.75,
    backgroundColor: '#0a0a0a',
  },
  productImage: {
    width: width,
    height: width * 0.75,
    padding: SPACING.xl,
  },
  productImagePlaceholder: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.lg,
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  infoSection: {
    padding: SPACING.lg,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  storeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  storeBadge: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    marginBottom: SPACING.sm,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
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
  matchesSection: {
    marginBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
  },
  vendorCard: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  vendorBest: {
    borderColor: COLORS.primary,
  },
  bestBadge: {
    position: 'absolute',
    top: -10,
    left: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsSection: {
    marginBottom: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
  },
  detailsGrid: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewOnStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  viewOnStoreButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
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
  alertConfirmCard: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  modalScrollContent: {
    justifyContent: 'flex-end',
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
