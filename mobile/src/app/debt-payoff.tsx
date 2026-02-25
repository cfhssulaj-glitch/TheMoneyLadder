import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CreditCard,
  Calendar,
  TrendingDown,
  DollarSign,
  Home,
  AlertCircle,
  Zap,
  Target,
  Sparkles,
  Lock,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  useFinanceStore,
  calculateAllDebtPayoffs,
  getDebtSummary,
  calculateSpendingLimits,
  DebtPayoffProjection,
  DebtItem,
} from '@/lib/finance-store';

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

const formatYearsMonths = (months: number): string => {
  if (months >= 360) return '30+ years';
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years}y ${remainingMonths}mo`;
};

interface StrategyResult {
  name: string;
  description: string;
  totalInterest: number;
  monthsToPayoff: number;
  interestSaved: number;
  timeSaved: number;
  extraMonthlyPayment: number;
  icon: 'zap' | 'target' | 'sparkles';
  color: string;
}

function calculateStrategyPayoff(
  debts: DebtItem[],
  extraPayment: number,
  strategy: 'avalanche' | 'snowball'
): { totalInterest: number; monthsToPayoff: number } {
  if (debts.length === 0 || extraPayment <= 0) {
    return { totalInterest: 0, monthsToPayoff: 0 };
  }

  let debtsCopy = debts.map(d => ({
    ...d,
    remainingBalance: d.balance,
  }));

  if (strategy === 'avalanche') {
    debtsCopy.sort((a, b) => b.interestRate - a.interestRate);
  } else {
    debtsCopy.sort((a, b) => a.remainingBalance - b.remainingBalance);
  }

  let totalInterest = 0;
  let months = 0;
  const maxMonths = 360;

  while (debtsCopy.some(d => d.remainingBalance > 0) && months < maxMonths) {
    let remainingExtra = extraPayment;

    for (const debt of debtsCopy) {
      if (debt.remainingBalance <= 0) continue;

      const monthlyRate = debt.interestRate / 100 / 12;
      const interestCharge = debt.remainingBalance * monthlyRate;
      totalInterest += interestCharge;

      const principalFromMin = Math.min(
        debt.minimumPayment - interestCharge,
        debt.remainingBalance
      );

      if (debt.minimumPayment <= interestCharge) {
        debt.remainingBalance += interestCharge - debt.minimumPayment;
      } else {
        debt.remainingBalance = Math.max(0, debt.remainingBalance - principalFromMin);
      }
    }

    for (const debt of debtsCopy) {
      if (debt.remainingBalance <= 0 || remainingExtra <= 0) continue;

      const extraApplied = Math.min(remainingExtra, debt.remainingBalance);
      debt.remainingBalance -= extraApplied;
      remainingExtra -= extraApplied;

      if (debt.remainingBalance <= 0) {
        continue;
      }
      break;
    }

    months++;

    if (strategy === 'snowball') {
      debtsCopy.sort((a, b) => {
        if (a.remainingBalance <= 0 && b.remainingBalance > 0) return 1;
        if (b.remainingBalance <= 0 && a.remainingBalance > 0) return -1;
        return a.remainingBalance - b.remainingBalance;
      });
    }
  }

  return { totalInterest: Math.round(totalInterest), monthsToPayoff: months };
}

function calculateCurrentPayoff(debts: DebtItem[]): { totalInterest: number; monthsToPayoff: number } {
  if (debts.length === 0) return { totalInterest: 0, monthsToPayoff: 0 };

  const projections = calculateAllDebtPayoffs(debts);
  const totalInterest = projections.reduce((sum, p) => sum + p.totalInterestPaid, 0);
  const maxMonths = Math.max(...projections.map(p => p.monthsToPayoff));

  return { totalInterest, monthsToPayoff: maxMonths };
}

interface DebtCardProps {
  projection: DebtPayoffProjection;
  index: number;
}

function DebtCard({ projection, index }: DebtCardProps) {
  const isNeverPaidOff = projection.monthsToPayoff >= 360;

  return (
    <Animated.View
      entering={FadeIn.delay(index * 100).duration(400)}
      className="mb-4"
    >
      <View className={`rounded-2xl overflow-hidden ${
        projection.isMortgage ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800/50'
      }`}>
        <View className="p-4 border-b border-slate-700/50">
          <View className="flex-row items-center">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
              projection.isMortgage ? 'bg-blue-500/20' : 'bg-red-500/20'
            }`}>
              {projection.isMortgage ? (
                <Home size={20} color="#3b82f6" />
              ) : (
                <CreditCard size={20} color="#f87171" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">{projection.name}</Text>
              {projection.isMortgage && (
                <Text className="text-blue-400 text-xs">Mortgage</Text>
              )}
            </View>
            <View className="items-end">
              <Text className="text-amber-400 font-medium">{projection.interestRate}%</Text>
              <Text className="text-slate-500 text-xs">APR</Text>
            </View>
          </View>
        </View>

        <View className="p-4">
          {isNeverPaidOff ? (
            <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex-row items-center">
              <AlertCircle size={24} color="#f87171" />
              <View className="ml-3 flex-1">
                <Text className="text-red-400 font-medium">Payment too low</Text>
                <Text className="text-slate-400 text-sm">
                  Your minimum payment doesn't cover the monthly interest. Increase payment to pay off this debt.
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <View className="bg-slate-700/50 rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <DollarSign size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs ml-1">Original Balance</Text>
                    </View>
                    <Text className="text-white text-lg font-semibold">
                      {formatCurrency(projection.originalBalance)}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <TrendingDown size={14} color="#f87171" />
                      <Text className="text-red-400 text-xs ml-1">Total Interest</Text>
                    </View>
                    <Text className="text-red-400 text-lg font-semibold">
                      {formatCurrency(projection.totalInterestPaid)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row">
                <View className="flex-1 mr-2">
                  <View className="bg-slate-700/50 rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <Calendar size={14} color="#94a3b8" />
                      <Text className="text-slate-400 text-xs ml-1">Years to Payoff</Text>
                    </View>
                    <Text className="text-white text-lg font-semibold">
                      {formatYearsMonths(projection.monthsToPayoff)}
                    </Text>
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <Calendar size={14} color="#10b981" />
                      <Text className="text-emerald-400 text-xs ml-1">Paid Off By</Text>
                    </View>
                    <Text className="text-emerald-400 text-lg font-semibold">
                      {formatDate(projection.payoffDate)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-4 bg-slate-700/30 rounded-xl p-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-400">Monthly Payment</Text>
                  <Text className="text-white font-semibold">
                    {formatCurrency(projection.minimumPayment)}/mo
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

interface StrategyCardProps {
  strategy: StrategyResult;
  index: number;
  isBest: boolean;
}

function StrategyCard({ strategy, index, isBest }: StrategyCardProps) {
  const IconComponent = strategy.icon === 'zap' ? Zap : strategy.icon === 'target' ? Target : Sparkles;
  const iconColor = strategy.icon === 'zap' ? '#f59e0b' : strategy.icon === 'target' ? '#3b82f6' : '#8b5cf6';
  const bgColor = strategy.icon === 'zap' ? 'bg-amber-500/10 border-amber-500/30' :
                  strategy.icon === 'target' ? 'bg-blue-500/10 border-blue-500/30' :
                  'bg-purple-500/10 border-purple-500/30';

  return (
    <Animated.View
      entering={FadeIn.delay(index * 150).duration(400)}
      className="mb-4"
    >
      <View className={`rounded-2xl overflow-hidden border ${bgColor} ${isBest ? 'border-2' : ''}`}>
        {isBest && (
          <View className="bg-emerald-500 px-3 py-1">
            <Text className="text-white text-xs font-semibold text-center">BEST STRATEGY</Text>
          </View>
        )}
        <View className="p-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${iconColor}20` }}>
              <IconComponent size={20} color={iconColor} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">{strategy.name}</Text>
              <Text className="text-slate-400 text-xs">{strategy.description}</Text>
            </View>
          </View>

          <View className="bg-slate-800/50 rounded-xl p-3 mb-3">
            <Text className="text-slate-400 text-xs mb-1">Extra Monthly Payment</Text>
            <Text className="text-white text-xl font-bold">
              +{formatCurrency(strategy.extraMonthlyPayment)}/mo
            </Text>
            <Text className="text-slate-500 text-xs mt-1">Half of your fun money budget</Text>
          </View>

          <View className="flex-row mb-2">
            <View className="flex-1 mr-2">
              <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <Text className="text-emerald-400 text-xs mb-1">Interest Saved</Text>
                <Text className="text-emerald-400 text-lg font-bold">
                  {formatCurrency(strategy.interestSaved)}
                </Text>
              </View>
            </View>
            <View className="flex-1 ml-2">
              <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <Text className="text-blue-400 text-xs mb-1">Time Saved</Text>
                <Text className="text-blue-400 text-lg font-bold">
                  {formatYearsMonths(strategy.timeSaved)}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <View className="bg-slate-700/50 rounded-xl p-3">
                <Text className="text-slate-400 text-xs mb-1">New Total Interest</Text>
                <Text className="text-white font-semibold">
                  {formatCurrency(strategy.totalInterest)}
                </Text>
              </View>
            </View>
            <View className="flex-1 ml-2">
              <View className="bg-slate-700/50 rounded-xl p-3">
                <Text className="text-slate-400 text-xs mb-1">Debt Free In</Text>
                <Text className="text-white font-semibold">
                  {formatYearsMonths(strategy.monthsToPayoff)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function DebtPayoffScreen() {
  const router = useRouter();
  const debtItems = useFinanceStore((s) => s.data.debtItems) || [];
  const financialData = useFinanceStore((s) => s.data);
  const isPremium = useFinanceStore((s) => s.isPremium);

  const projections = calculateAllDebtPayoffs(debtItems);
  const summary = getDebtSummary(debtItems);
  const spendingLimits = calculateSpendingLimits(financialData);

  const nonMortgageProjections = projections.filter((p) => !p.isMortgage);
  const nonMortgageItems = debtItems.filter((d) => !d.isMortgage);

  const totalInterestPaid = nonMortgageProjections.reduce((sum, p) => sum + p.totalInterestPaid, 0);
  const latestPayoffDate = nonMortgageProjections.reduce((latest, p) => {
    if (p.monthsToPayoff >= 360) return latest;
    return p.payoffDate > latest ? p.payoffDate : latest;
  }, new Date());

  const currentPayoff = calculateCurrentPayoff(nonMortgageItems);
  const halfFunMoney = Math.round(spendingLimits.monthlyFunMoney / 2);

  const strategies: StrategyResult[] = [];

  if (nonMortgageItems.length > 0 && halfFunMoney > 0) {
    const avalancheResult = calculateStrategyPayoff(nonMortgageItems, halfFunMoney, 'avalanche');
    const snowballResult = calculateStrategyPayoff(nonMortgageItems, halfFunMoney, 'snowball');

    strategies.push({
      name: 'Avalanche Method',
      description: 'Pay highest interest first - saves the most money',
      totalInterest: avalancheResult.totalInterest,
      monthsToPayoff: avalancheResult.monthsToPayoff,
      interestSaved: Math.max(0, currentPayoff.totalInterest - avalancheResult.totalInterest),
      timeSaved: Math.max(0, currentPayoff.monthsToPayoff - avalancheResult.monthsToPayoff),
      extraMonthlyPayment: halfFunMoney,
      icon: 'zap',
      color: '#f59e0b',
    });

    strategies.push({
      name: 'Snowball Method',
      description: 'Pay smallest balance first - quick wins for motivation',
      totalInterest: snowballResult.totalInterest,
      monthsToPayoff: snowballResult.monthsToPayoff,
      interestSaved: Math.max(0, currentPayoff.totalInterest - snowballResult.totalInterest),
      timeSaved: Math.max(0, currentPayoff.monthsToPayoff - snowballResult.monthsToPayoff),
      extraMonthlyPayment: halfFunMoney,
      icon: 'target',
      color: '#3b82f6',
    });
  }

  const bestStrategyIndex = strategies.length > 0
    ? strategies.reduce((best, s, i) => s.interestSaved > strategies[best].interestSaved ? i : best, 0)
    : -1;

  if (nonMortgageItems.length === 0) {
    return (
      <View className="flex-1 bg-slate-950">
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1" edges={['top']}>
            <View className="flex-row items-center px-4 py-3 border-b border-slate-800">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center mr-3"
              >
                <ChevronLeft size={24} color="#fff" />
              </Pressable>
              <Text className="text-white text-lg font-bold flex-1">Debt Payoff Calculator</Text>
            </View>

            <View className="flex-1 justify-center items-center px-6">
              <View className="w-16 h-16 rounded-full bg-slate-800 items-center justify-center mb-4">
                <CreditCard size={32} color="#64748b" />
              </View>
              <Text className="text-white text-xl font-bold text-center">No Debts Added</Text>
              <Text className="text-slate-400 text-center mt-2">
                Add your debts in the Profile tab to see payoff projections.
              </Text>
              <Pressable
                onPress={() => router.back()}
                className="mt-6 bg-amber-500 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">Go Back</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          <Animated.View
            entering={FadeInDown.duration(400)}
            className="flex-row items-center px-4 py-3 border-b border-slate-800"
          >
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold">Debt Payoff Calculator</Text>
              <Text className="text-slate-400 text-sm">
                {debtItems.length} debt{debtItems.length !== 1 ? 's' : ''} tracked
              </Text>
            </View>
          </Animated.View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="px-5 mt-5"
            >
              <LinearGradient
                colors={['#ef4444', '#dc2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20 }}
              >
                <Text className="text-red-100 text-sm font-medium mb-1">
                  Total Debt Balance
                </Text>
                <Text className="text-white text-4xl font-bold">
                  {formatCurrency(summary.nonMortgageBalance)}
                </Text>

                <View className="flex-row mt-4 pt-4 border-t border-red-400/30">
                  <View className="flex-1">
                    <Text className="text-red-100 text-xs mb-1">Total Interest</Text>
                    <Text className="text-white text-lg font-semibold">
                      {formatCurrency(totalInterestPaid)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-100 text-xs mb-1">Debt Free By</Text>
                    <Text className="text-white text-lg font-semibold">
                      {formatDate(latestPayoffDate)}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              className="px-5 mt-4"
            >
              <View className="bg-slate-800/50 rounded-xl p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-400">Monthly payments (excl. mortgage)</Text>
                  <Text className="text-white font-semibold">
                    {formatCurrency(summary.nonMortgageMinPayment)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-400">Avg interest rate</Text>
                  <Text className="text-amber-400 font-semibold">
                    {summary.weightedAverageInterest}%
                  </Text>
                </View>
              </View>
            </Animated.View>

            {nonMortgageProjections.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(200).duration(500)}
                className="px-5 mt-6"
              >
                <Text className="text-white text-lg font-semibold mb-4">
                  Your Debts
                </Text>
                {nonMortgageProjections.map((projection, index) => (
                  <DebtCard key={projection.debtId} projection={projection} index={index} />
                ))}
              </Animated.View>
            )}

            {strategies.length > 0 && isPremium && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(500)}
                className="px-5 mt-6"
              >
                <View className="mb-4">
                  <Text className="text-white text-lg font-semibold">Payoff Strategies</Text>
                  <Text className="text-slate-400 text-sm mt-1">
                    Using {formatCurrency(halfFunMoney)}/mo extra (half your fun money)
                  </Text>
                </View>

                <View className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
                  <Text className="text-slate-400 text-xs mb-2">CURRENT PLAN (Minimum Payments Only)</Text>
                  <View className="flex-row">
                    <View className="flex-1 mr-2">
                      <Text className="text-slate-500 text-xs">Total Interest</Text>
                      <Text className="text-white font-semibold">{formatCurrency(currentPayoff.totalInterest)}</Text>
                    </View>
                    <View className="flex-1 ml-2">
                      <Text className="text-slate-500 text-xs">Time to Payoff</Text>
                      <Text className="text-white font-semibold">{formatYearsMonths(currentPayoff.monthsToPayoff)}</Text>
                    </View>
                  </View>
                </View>

                {strategies.map((strategy, index) => (
                  <StrategyCard
                    key={strategy.name}
                    strategy={strategy}
                    index={index}
                    isBest={index === bestStrategyIndex}
                  />
                ))}
              </Animated.View>
            )}

            {strategies.length > 0 && !isPremium && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(500)}
                className="px-5 mt-6"
              >
                <View className="mb-4">
                  <Text className="text-white text-lg font-semibold">Payoff Strategies</Text>
                  <Text className="text-slate-400 text-sm mt-1">
                    Compare avalanche vs snowball methods
                  </Text>
                </View>

                <View className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 mb-4">
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center mr-3">
                      <Zap size={20} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-semibold">Avalanche Method</Text>
                      <Text className="text-slate-600 text-xs">Pay highest interest first</Text>
                    </View>
                    <Lock size={16} color="#f59e0b" />
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                      <Target size={20} color="#3b82f6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-slate-500 font-semibold">Snowball Method</Text>
                      <Text className="text-slate-600 text-xs">Pay smallest balance first</Text>
                    </View>
                    <Lock size={16} color="#f59e0b" />
                  </View>
                </View>

                <Pressable
                  onPress={() => router.push('/paywall')}
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
                          Unlock Payoff Strategies
                        </Text>
                        <Text className="text-violet-200 text-sm">
                          See how to save {formatCurrency(currentPayoff.totalInterest > 500 ? Math.round(currentPayoff.totalInterest * 0.3) : 100)}+ in interest
                        </Text>
                      </View>
                      <ChevronRight size={20} color="#fff" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            )}

            {strategies.length === 0 && nonMortgageItems.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(500)}
                className="px-5 mt-6"
              >
                <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <Text className="text-amber-400 font-semibold mb-2">Add Income to See Strategies</Text>
                  <Text className="text-slate-300 text-sm leading-5">
                    Complete your profile with income information to see how much faster you could pay off debt using different strategies.
                  </Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
