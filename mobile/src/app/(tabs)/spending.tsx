import { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Wallet,
  Home,
  Car,
  UtensilsCrossed,
  Zap,
  Shield,
  PiggyBank,
  Sparkles,
  CircleDollarSign,
  Calendar,
  CalendarRange,
  Check,
  CreditCard,
  ChevronRight,
  TrendingDown,
  Lock,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { useFinanceStore, calculateSpendingLimits, FinancialData, getCarDebtPayments } from '@/lib/finance-store';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calculate color based on percentage difference from suggested
// For savings: over is good (green), under is bad (red)
// For expenses: under is good (green), over is bad (red)
function getBudgetColor(userAmount: number, suggestedAmount: number, isSavings: boolean): { bg: string; border: string; text: string; icon: string } {
  if (userAmount === 0 || suggestedAmount === 0) {
    return isSavings
      ? { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981', icon: '#10b981' }
      : { bg: 'rgba(51, 65, 85, 0.5)', border: 'transparent', text: '#94a3b8', icon: '#94a3b8' };
  }

  const percentDiff = ((userAmount - suggestedAmount) / suggestedAmount) * 100;

  // For savings: positive diff is good, negative is bad
  // For expenses: negative diff is good, positive is bad
  const isGood = isSavings ? percentDiff >= 0 : percentDiff <= 0;
  const intensity = Math.min(Math.abs(percentDiff) / 50, 1); // Max intensity at 50% difference

  if (isGood) {
    // Green gradient - from subtle to vibrant
    const alpha = 0.1 + intensity * 0.15;
    const borderAlpha = 0.3 + intensity * 0.4;
    return {
      bg: `rgba(16, 185, 129, ${alpha})`,
      border: `rgba(16, 185, 129, ${borderAlpha})`,
      text: '#10b981',
      icon: '#10b981',
    };
  } else {
    // Muted coral/rose - softer warning color
    const alpha = 0.1 + intensity * 0.15;
    const borderAlpha = 0.3 + intensity * 0.4;
    return {
      bg: `rgba(244, 114, 102, ${alpha})`,
      border: `rgba(244, 114, 102, ${borderAlpha})`,
      text: '#e07a6e',
      icon: '#e07a6e',
    };
  }
}

type CategoryKey = keyof FinancialData['userExpenses'];

const categoryIcons: Record<CategoryKey, React.ComponentType<{ size: number; color: string }>> = {
  housing: Home,
  transportation: Car,
  food: UtensilsCrossed,
  utilities: Zap,
  insurance: Shield,
  savings: PiggyBank,
  funMoney: Sparkles,
  miscellaneous: Wallet,
};

const categoryLabels: Record<CategoryKey, string> = {
  housing: 'Housing',
  transportation: 'Transportation',
  food: 'Food & Dining',
  utilities: 'Utilities',
  insurance: 'Insurance',
  savings: 'Savings',
  funMoney: 'Fun Money',
  miscellaneous: 'Miscellaneous',
};

const categoryPercentages: Record<CategoryKey, number> = {
  housing: 28,
  transportation: 12,
  food: 12,
  utilities: 6,
  insurance: 4,
  savings: 8,
  funMoney: 10,
  miscellaneous: 10,
};

// Categories that require premium
const PREMIUM_CATEGORIES: CategoryKey[] = ['food', 'savings', 'funMoney', 'miscellaneous'];

// Free categories shown to all users
const FREE_CATEGORIES: CategoryKey[] = ['housing', 'transportation', 'utilities', 'insurance'];

interface LockedCategoryRowProps {
  category: CategoryKey;
  onUnlockPress: () => void;
}

function LockedCategoryRow({ category, onUnlockPress }: LockedCategoryRowProps) {
  const IconComponent = categoryIcons[category];

  return (
    <Pressable
      onPress={onUnlockPress}
      className="mb-3 rounded-xl p-4 flex-row items-center active:opacity-80 bg-slate-800/30 border border-slate-700/50"
    >
      <View className="w-10 h-10 rounded-full items-center justify-center mr-4 bg-slate-700/50">
        <IconComponent size={20} color="#475569" />
      </View>

      <View className="flex-1">
        <Text className="font-medium text-slate-500">
          {categoryLabels[category]}
        </Text>
        <Text className="text-slate-600 text-xs">
          ??% of income
        </Text>
      </View>

      <View className="flex-row items-center">
        <Lock size={14} color="#f59e0b" />
        <Text className="text-amber-500 text-sm font-medium ml-1">
          Premium
        </Text>
      </View>
    </Pressable>
  );
}

interface CategoryRowProps {
  category: CategoryKey;
  suggestedAmount: number;
  userAmount: number;
  isExpanded: boolean;
  onPress: () => void;
  onSave: (value: number) => void;
}

function CategoryRow({ category, suggestedAmount, userAmount, isExpanded, onPress, onSave }: CategoryRowProps) {
  const [inputValue, setInputValue] = useState(userAmount > 0 ? userAmount.toString() : '');
  const inputRef = useRef<TextInput>(null);

  const IconComponent = categoryIcons[category];
  const percentage = categoryPercentages[category];
  const isSavings = category === 'savings';
  const hasUserValue = userAmount > 0;

  // Get dynamic colors based on budget status
  const colors = getBudgetColor(userAmount, suggestedAmount, isSavings);

  const handleSubmit = () => {
    const numValue = parseFloat(inputValue.replace(/[^0-9.]/g, '')) || 0;
    onSave(numValue);
    Keyboard.dismiss();
  };

  // Focus input when expanded
  if (isExpanded && inputRef.current) {
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={hasUserValue ? {
          backgroundColor: colors.bg,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 12,
          borderRadius: 12,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
        } : undefined}
        className={hasUserValue ? 'active:opacity-80' : `mb-3 rounded-xl p-4 flex-row items-center active:opacity-80 ${
          isSavings ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50'
        }`}
      >
        <View
          style={hasUserValue ? { backgroundColor: colors.bg } : undefined}
          className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
            !hasUserValue ? (isSavings ? 'bg-emerald-500/20' : 'bg-slate-700') : ''
          }`}
        >
          <IconComponent
            size={20}
            color={hasUserValue ? colors.icon : (isSavings ? '#10b981' : '#94a3b8')}
          />
        </View>

        <View className="flex-1">
          <Text
            style={hasUserValue ? { color: colors.text } : undefined}
            className={`font-medium ${
              !hasUserValue ? (isSavings ? 'text-emerald-400' : 'text-white') : ''
            }`}
          >
            {categoryLabels[category]}
          </Text>
          <Text className="text-slate-500 text-xs">
            {percentage}% suggested
          </Text>
        </View>

        <View className="items-end">
          {hasUserValue ? (
            <>
              <Text
                style={{ color: colors.text }}
                className="text-lg font-semibold"
              >
                {formatCurrency(userAmount)}
              </Text>
              <Text className="text-slate-500 text-xs">
                {formatCurrency(suggestedAmount)} suggested
              </Text>
            </>
          ) : (
            <Text
              className={`text-lg font-semibold ${
                isSavings ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              {formatCurrency(suggestedAmount)}
            </Text>
          )}
        </View>
      </Pressable>

      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="mb-3 -mt-1 mx-2"
        >
          <View className="bg-slate-700/50 rounded-xl p-3 flex-row items-center">
            <Text className="text-slate-400 text-lg mr-2">$</Text>
            <TextInput
              ref={inputRef}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="Enter your amount"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              className="flex-1 text-white text-lg"
              style={{ padding: 0 }}
            />
            <Pressable
              onPress={handleSubmit}
              className="bg-amber-500 w-10 h-10 rounded-full items-center justify-center ml-2 active:bg-amber-600"
            >
              <Check size={20} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

export default function SpendingScreen() {
  const router = useRouter();
  const data = useFinanceStore((s) => s.data);
  const debtItems = useFinanceStore((s) => s.data.debtItems);
  const monthlyDebtPayment = useFinanceStore((s) => s.data.monthlyDebtPayment);
  const hasCompletedOnboarding = useFinanceStore((s) => s.hasCompletedOnboarding);
  const isPremium = useFinanceStore((s) => s.isPremium);
  const updateUserExpense = useFinanceStore((s) => s.updateUserExpense);
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(null);

  const spendingLimits = calculateSpendingLimits(data);
  const { dailySpendingByNetWorth, spendingByIncome, weeklyFunMoney, monthlyFunMoney } = spendingLimits;

  // Calculate car debt payments to subtract from transportation
  const carDebtPayments = getCarDebtPayments(debtItems || []);

  // Create adjusted spending limits where car debt is subtracted from transportation
  const adjustedSpendingByIncome = {
    ...spendingByIncome,
    transportation: Math.max(0, spendingByIncome.transportation - carDebtPayments),
  };

  const handleCategoryPress = (category: CategoryKey) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
      Keyboard.dismiss();
    } else {
      setExpandedCategory(category);
    }
  };

  const handleSaveExpense = (category: CategoryKey, value: number) => {
    updateUserExpense(category, value);
    setExpandedCategory(null);
  };

  const handleUnlockPress = () => {
    router.push('/paywall');
  };

  if (!hasCompletedOnboarding || data.monthlyIncome === 0) {
    return (
      <View className="flex-1 bg-slate-950">
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 justify-center px-6" edges={['top']}>
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center mb-4">
                <CircleDollarSign size={32} color="#f59e0b" />
              </View>
              <Text className="text-white text-xl font-bold text-center">
                Set Up Your Finances First
              </Text>
              <Text className="text-slate-400 text-center mt-2">
                Head to the Profile tab to enter your income and net worth to see your personalized spending limits.
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  const categories = Object.keys(adjustedSpendingByIncome) as CategoryKey[];

  // Separate free and premium categories while maintaining order
  const freeCategories = categories.filter(c => FREE_CATEGORIES.includes(c));
  const premiumCategories = categories.filter(c => PREMIUM_CATEGORIES.includes(c));

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="px-5 pt-4 pb-2"
            >
              <Text className="text-slate-400 text-sm">Your Budget</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                Spending Limits
              </Text>
            </Animated.View>

            {/* Net Worth Daily Spending Card */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              className="px-5 mt-4"
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20 }}
              >
                <Text className="text-amber-100 text-sm font-medium mb-1">
                  Don't Sweat It Threshold
                </Text>
                <Text className="text-white text-3xl font-bold">
                  {formatCurrency(dailySpendingByNetWorth)}
                </Text>
                <Text className="text-amber-100 text-base mt-1">
                  per day • no stress zone
                </Text>

                <View className="flex-row mt-4 pt-4 border-t border-amber-400/30">
                  <View className="flex-1 flex-row items-center">
                    <Calendar size={16} color="#fef3c7" />
                    <Text className="text-amber-100 text-sm ml-2">
                      {formatCurrency(dailySpendingByNetWorth * 7)}/week
                    </Text>
                  </View>
                  <View className="flex-1 flex-row items-center">
                    <CalendarRange size={16} color="#fef3c7" />
                    <Text className="text-amber-100 text-sm ml-2">
                      {formatCurrency(dailySpendingByNetWorth * 30)}/month
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* How it works */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              className="px-5 mt-4"
            >
              <View className="bg-slate-800/50 rounded-xl p-4">
                <Text className="text-slate-300 text-sm leading-5">
                  <Text className="text-amber-400 font-semibold">Liquid Net Worth ÷ 10,000: </Text>
                  Skip the mental math on small purchases. Extra guac, a cleaning service, the nicer option — if it's under this amount, don't overthink it.
                </Text>
              </View>
            </Animated.View>

            {/* Income-Based Spending Section */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(500)}
              className="px-5 mt-8"
            >
              <Text className="text-white text-lg font-semibold mb-2">
                Monthly Budget by Net Income
              </Text>
              <Text className="text-slate-400 text-sm mb-4">
                Based on {formatCurrency(spendingLimits.monthlyNetIncome)}/month after taxes. Tap to add your expense.
              </Text>

              {/* Free Categories */}
              {freeCategories.map((category, index) => (
                <Animated.View
                  key={category}
                  entering={FadeInDown.delay(300 + index * 50).duration(400)}
                >
                  <CategoryRow
                    category={category}
                    suggestedAmount={adjustedSpendingByIncome[category]}
                    userAmount={data.userExpenses?.[category] ?? 0}
                    isExpanded={expandedCategory === category}
                    onPress={() => handleCategoryPress(category)}
                    onSave={(value) => handleSaveExpense(category, value)}
                  />
                  {category === 'transportation' && carDebtPayments > 0 && (
                    <View className="mb-3 -mt-1 mx-2 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <View className="flex-row items-center">
                        <Car size={14} color="#3b82f6" />
                        <Text className="text-blue-400 text-xs ml-2 flex-1">
                          Car debt payment ({formatCurrency(carDebtPayments)}/mo) already deducted
                        </Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              ))}

              {/* Premium Categories - Show locked or unlocked based on premium status */}
              {premiumCategories.map((category, index) => (
                <Animated.View
                  key={category}
                  entering={FadeInDown.delay(300 + (freeCategories.length + index) * 50).duration(400)}
                >
                  {isPremium ? (
                    <CategoryRow
                      category={category}
                      suggestedAmount={adjustedSpendingByIncome[category]}
                      userAmount={data.userExpenses?.[category] ?? 0}
                      isExpanded={expandedCategory === category}
                      onPress={() => handleCategoryPress(category)}
                      onSave={(value) => handleSaveExpense(category, value)}
                    />
                  ) : (
                    <LockedCategoryRow
                      category={category}
                      onUnlockPress={handleUnlockPress}
                    />
                  )}
                </Animated.View>
              ))}
            </Animated.View>

            {/* Debt Payment Card */}
            <Animated.View
              entering={FadeInDown.delay(550).duration(500)}
              className="px-5 mt-6"
            >
              <Pressable
                onPress={() => router.push('/debt-payoff')}
                className="active:opacity-80"
              >
                <View
                  className={`rounded-xl p-4 ${
                    monthlyDebtPayment > 0
                      ? 'bg-red-500/10 border border-red-500/30'
                      : 'bg-slate-800/50 border border-dashed border-slate-600'
                  }`}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                        monthlyDebtPayment > 0 ? 'bg-red-500/20' : 'bg-slate-700'
                      }`}
                    >
                      <CreditCard size={20} color={monthlyDebtPayment > 0 ? '#f87171' : '#94a3b8'} />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-medium ${
                          monthlyDebtPayment > 0 ? 'text-red-400' : 'text-slate-400'
                        }`}
                      >
                        Monthly Debt Payment
                      </Text>
                      <Text className="text-slate-500 text-xs">
                        {monthlyDebtPayment > 0 ? 'Excludes mortgage • Tap for details' : 'Add debts in Profile'}
                      </Text>
                    </View>
                    <Text
                      className={`text-lg font-semibold mr-2 ${
                        monthlyDebtPayment > 0 ? 'text-red-400' : 'text-slate-500'
                      }`}
                    >
                      {monthlyDebtPayment > 0 ? formatCurrency(monthlyDebtPayment) : '$0'}
                    </Text>
                    <ChevronRight size={20} color="#64748b" />
                  </View>

                  {monthlyDebtPayment > 0 && (
                    <View className="mt-3 pt-3 border-t border-red-500/20 flex-row items-center">
                      <TrendingDown size={14} color="#f87171" />
                      <Text className="text-slate-400 text-xs ml-2">
                        This reduces your Fun Money by {formatCurrency(monthlyDebtPayment)}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Animated.View>

            {/* Fun Money Comparison - Premium only */}
            {isPremium && (
              <Animated.View
                entering={FadeInDown.delay(600).duration(500)}
                className="px-5 mt-6"
              >
                <View className="bg-slate-800/30 rounded-xl p-4">
                  <Text className="text-white font-semibold mb-3">
                    Your Fun Money Options
                  </Text>
                  <View className="flex-row justify-between">
                    <View className="flex-1 mr-2">
                      <Text className="text-slate-500 text-xs mb-1">By Liquid Net Worth</Text>
                      <Text className="text-amber-400 text-lg font-bold">
                        {formatCurrency(dailySpendingByNetWorth * 30)}/mo
                      </Text>
                    </View>
                    <View className="w-px bg-slate-700" />
                    <View className="flex-1 ml-2">
                      <Text className="text-slate-500 text-xs mb-1">By Income (10%)</Text>
                      <Text className="text-blue-400 text-lg font-bold">
                        {formatCurrency(monthlyFunMoney)}/mo
                      </Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 text-xs mt-3">
                    Use the lower amount for faster wealth building, or the higher for more flexibility.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Upgrade CTA for free users */}
            {!isPremium && (
              <Animated.View
                entering={FadeInDown.delay(600).duration(500)}
                className="px-5 mt-6"
              >
                <Pressable
                  onPress={handleUnlockPress}
                  className="active:opacity-80"
                >
                  <LinearGradient
                    colors={['#7c3aed', '#5b21b6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 16 }}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-4">
                        <Sparkles size={20} color="#fff" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">
                          Unlock Full Budget
                        </Text>
                        <Text className="text-violet-200 text-sm">
                          Food, savings, fun money & more
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#fff" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
