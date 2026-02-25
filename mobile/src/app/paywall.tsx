import { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Shield,
  Check,
  Sparkles,
  X,
  UtensilsCrossed,
  PiggyBank,
  Wallet,
  Target,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { type PurchasesPackage } from 'react-native-purchases';
import * as Linking from 'expo-linking';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  hasEntitlement,
  isRevenueCatEnabled,
} from '@/lib/revenuecatClient';

const TERMS_URL = 'https://themoneyladder.app/terms';
const PRIVACY_URL = 'https://themoneyladder.app/privacy';

const formatPrice = (pkg: PurchasesPackage): string => {
  return pkg.product.priceString;
};

export default function PaywallScreen() {
  const router = useRouter();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setIsLoading(true);
    setError(null);

    if (!isRevenueCatEnabled()) {
      setError('Purchases are only available in the mobile app.');
      setIsLoading(false);
      return;
    }

    const result = await getOfferings();
    if (result.ok && result.data.current) {
      const availablePackages = result.data.current.availablePackages;
      setPackages(availablePackages);
      // Default to lifetime
      const lifetime = availablePackages.find((p) => p.identifier === '$rc_lifetime');
      setSelectedPackage(lifetime || availablePackages[0] || null);
    } else {
      setError('Unable to load subscription options. Please try again.');
    }
    setIsLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsPurchasing(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await purchasePackage(selectedPackage);

    if (result.ok) {
      // Check if they now have premium
      const entitlementResult = await hasEntitlement('premium');
      if (entitlementResult.ok && entitlementResult.data) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } else if (result.reason === 'sdk_error') {
      // User likely cancelled - don't show error
      console.log('Purchase cancelled or failed');
    }

    setIsPurchasing(false);
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await restorePurchases();

    if (result.ok) {
      const entitlementResult = await hasEntitlement('premium');
      if (entitlementResult.ok && entitlementResult.data) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        setError('No previous purchases found.');
      }
    } else {
      setError('Unable to restore purchases. Please try again.');
    }

    setIsRestoring(false);
  };

  const features = [
    { text: 'Food & Dining budget guidance', icon: UtensilsCrossed },
    { text: 'Savings targets & tracking', icon: PiggyBank },
    { text: 'Fun Money & Miscellaneous budgets', icon: Sparkles },
    { text: 'Debt payoff strategy comparisons', icon: Target },
  ];

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
            >
              <X size={20} color="#fff" />
            </Pressable>
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              className="px-4 py-2"
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#f59e0b" />
              ) : (
                <Text className="text-amber-400 font-medium">Restore</Text>
              )}
            </Pressable>
          </View>

          {isLoading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#f59e0b" />
              <Text className="text-slate-400 mt-4">Loading options...</Text>
            </View>
          ) : (
            <View className="flex-1 px-5">
              {/* Hero */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(500)}
                className="items-center mt-4"
              >
                <View className="w-20 h-20 rounded-full bg-violet-500/20 items-center justify-center mb-4">
                  <Sparkles size={40} color="#8b5cf6" />
                </View>
                <Text className="text-white text-2xl font-bold text-center">
                  Unlock Full Budget
                </Text>
                <Text className="text-slate-400 text-center mt-2">
                  Get complete spending guidance & debt strategies
                </Text>
              </Animated.View>

              {/* Features */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                className="mt-8"
              >
                {features.map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <View key={index} className="flex-row items-center mb-4">
                      <View className="w-10 h-10 rounded-full bg-violet-500/20 items-center justify-center mr-3">
                        <IconComponent size={18} color="#8b5cf6" />
                      </View>
                      <Text className="text-white flex-1 text-base">{feature.text}</Text>
                    </View>
                  );
                })}
              </Animated.View>

              {/* Package Selection */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(500)}
                className="mt-8"
              >
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.identifier === pkg.identifier;
                  const isLifetime = pkg.identifier === '$rc_lifetime';
                  const isYearly = pkg.identifier === '$rc_annual';

                  return (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPackage(pkg);
                      }}
                      className={`mb-3 rounded-2xl p-4 border-2 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-slate-700 bg-slate-800/50'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <View className="flex-row items-center">
                            <Text className={`text-lg font-semibold ${isSelected ? 'text-violet-400' : 'text-white'}`}>
                              {isLifetime ? 'Lifetime' : isYearly ? 'Yearly' : pkg.product.title}
                            </Text>
                            {isLifetime && (
                              <View className="ml-2 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                <Text className="text-emerald-400 text-xs font-medium">Best Value</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-slate-400 text-sm mt-1">
                            {isLifetime ? 'One-time purchase' : isYearly ? 'Billed annually' : ''}
                          </Text>
                        </View>
                        <Text className={`text-xl font-bold ${isSelected ? 'text-violet-400' : 'text-white'}`}>
                          {formatPrice(pkg)}
                        </Text>
                      </View>
                      {isSelected && (
                        <View className="absolute top-3 right-3">
                          <View className="w-6 h-6 rounded-full bg-violet-500 items-center justify-center">
                            <Check size={14} color="#fff" />
                          </View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </Animated.View>

              {/* Error Message */}
              {error && (
                <Animated.View entering={FadeIn.duration(300)} className="mt-4">
                  <Text className="text-red-400 text-center">{error}</Text>
                </Animated.View>
              )}

              {/* Spacer */}
              <View className="flex-1" />

              {/* Purchase Button */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(500)}
                className="mb-4"
              >
                <Pressable
                  onPress={handlePurchase}
                  disabled={isPurchasing || !selectedPackage}
                  className="active:opacity-80"
                >
                  <LinearGradient
                    colors={isPurchasing ? ['#64748b', '#475569'] : ['#7c3aed', '#5b21b6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isPurchasing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Sparkles size={20} color="#fff" />
                        <Text className="text-white text-center text-lg font-semibold ml-2">
                          {selectedPackage?.identifier === '$rc_lifetime'
                            ? 'Get Lifetime Access'
                            : 'Subscribe Now'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>

                <Text className="text-slate-500 text-xs text-center mt-3">
                  {selectedPackage?.identifier === '$rc_lifetime'
                    ? 'One-time payment. No subscription.'
                    : selectedPackage?.identifier === '$rc_annual'
                      ? `Billed at ${selectedPackage ? formatPrice(selectedPackage) : ''}/year. Cancel anytime. Subscription auto-renews.`
                      : 'Cancel anytime. Subscription auto-renews.'}
                </Text>
                <View className="flex-row justify-center mt-3 gap-3">
                  <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
                    <Text className="text-slate-500 text-xs underline">Terms of Service</Text>
                  </Pressable>
                  <Text className="text-slate-600 text-xs">|</Text>
                  <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
                    <Text className="text-slate-500 text-xs underline">Privacy Policy</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
