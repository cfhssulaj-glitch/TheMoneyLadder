import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  TrendingUp,
  Target,
  Users,
  Sparkles,
  Info,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useFinanceStore, calculateSpendingLimits } from '@/lib/finance-store';

const { width: screenWidth } = Dimensions.get('window');

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatCurrencyFull = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Money Guy Wealth Multiplier - how much $1 grows by age 65
// Based on historical S&P 500 returns (~10% annually)
// Source: https://moneyguy.com/guide/wealth-multiplier/
const WEALTH_MULTIPLIERS: Record<number, number> = {
  // Age 0-9 (interpolated from 647.47 to 239.18)
  0: 647.47,
  1: 606.64,
  2: 565.81,
  3: 524.98,
  4: 484.15,
  5: 443.32,
  6: 402.49,
  7: 361.66,
  8: 320.83,
  9: 280.00,
  // Age 10-19 (interpolated from 239.18 to 88.35)
  10: 239.18,
  11: 224.10,
  12: 209.01,
  13: 193.93,
  14: 178.85,
  15: 163.77,
  16: 148.68,
  17: 133.60,
  18: 118.52,
  19: 103.43,
  // Age 20-29 (interpolated from 88.35 to 23.06)
  20: 88.35,
  21: 81.82,
  22: 75.29,
  23: 68.76,
  24: 62.23,
  25: 55.71,
  26: 49.18,
  27: 42.65,
  28: 36.12,
  29: 29.59,
  // Age 30-39 (interpolated from 23.06 to 7.34)
  30: 23.06,
  31: 21.49,
  32: 19.92,
  33: 18.34,
  34: 16.77,
  35: 15.20,
  36: 13.63,
  37: 12.06,
  38: 10.48,
  39: 8.91,
  // Age 40-49 (interpolated from 7.34 to 2.85)
  40: 7.34,
  41: 6.89,
  42: 6.44,
  43: 5.99,
  44: 5.54,
  45: 5.10,
  46: 4.65,
  47: 4.20,
  48: 3.75,
  49: 3.30,
  // Age 50-59 (interpolated from 2.85 to 1.35)
  50: 2.85,
  51: 2.70,
  52: 2.55,
  53: 2.40,
  54: 2.25,
  55: 2.10,
  56: 1.95,
  57: 1.80,
  58: 1.65,
  59: 1.50,
  // Age 60-65 (interpolated from 1.35 to 1.00)
  60: 1.35,
  61: 1.28,
  62: 1.21,
  63: 1.14,
  64: 1.07,
  65: 1.00,
};

// Money Guy Net Worth Targets (income multipliers by age)
const NET_WORTH_TARGETS: Record<number, number> = {
  25: 0.5,
  30: 1,
  35: 2,
  40: 3,
  45: 4.5,
  50: 6.5,
  55: 10,
  60: 13.7,
  65: 20,
};

// Average American net worth by age (median investable assets)
const AVERAGE_AMERICAN_NET_WORTH: Record<number, number> = {
  25: 10000,
  30: 22000,
  35: 28000,
  40: 34000,
  45: 45000,
  50: 56000,
  55: 62000,
  60: 70000,
  65: 103000,
};

// Wealth Architect net worth by age (top-tier savers from 2025 survey of 25,000 people)
// Based on actual survey data with compound growth modeling
// People who consistently save 20%+ of their income
const WEALTH_ARCHITECT_NET_WORTH: Record<number, number> = {
  20: 18352,
  21: 35000,
  22: 52000,
  23: 68000,
  24: 85000,
  25: 100000,
  26: 110352, // Reference point from chart
  27: 148470,
  28: 187000,
  29: 228000,
  30: 270292,
  31: 316203,
  32: 365103,
  33: 583848, // Reference point from chart
  34: 640000,
  35: 700858,
  36: 767769,
  37: 834680,
  38: 901591,
  39: 968502,
  40: 1035413,
  41: 1119136,
  42: 1186047,
  43: 1319869, // Reference point from chart
  44: 1386760,
  45: 1453691,
  46: 1520602,
  47: 1587513,
  48: 1654424,
  49: 1721335,
  50: 1788246,
  51: 1855157,
  52: 1922068,
  53: 1988979,
  54: 2022000,
  55: 2055891, // Reference point from chart
  56: 2122802,
  57: 2189713,
  58: 2256624,
  59: 2323535,
  60: 2390446,
  61: 2457357,
  62: 2524179,
  63: 2591001,
  64: 2691000,
  65: 2791912, // Reference point from chart - end target ~$2.8M
};

// Get interpolated value for any age
function getValueForAge(data: Record<number, number>, age: number): number {
  const ages = Object.keys(data).map(Number).sort((a, b) => a - b);

  if (age <= ages[0]) return data[ages[0]];
  if (age >= ages[ages.length - 1]) return data[ages[ages.length - 1]];

  // Find surrounding ages
  let lowerAge = ages[0];
  let upperAge = ages[ages.length - 1];

  for (let i = 0; i < ages.length - 1; i++) {
    if (age >= ages[i] && age <= ages[i + 1]) {
      lowerAge = ages[i];
      upperAge = ages[i + 1];
      break;
    }
  }

  // Linear interpolation
  const ratio = (age - lowerAge) / (upperAge - lowerAge);
  return data[lowerAge] + (data[upperAge] - data[lowerAge]) * ratio;
}

// Calculate projected net worth based on current savings rate
// Compounds at 8% nominal return, then discounts to present value using 3% inflation
function projectNetWorth(
  currentNetWorth: number,
  annualSavings: number,
  currentAge: number,
  targetAge: number,
  nominalReturn: number = 0.08,
  inflation: number = 0.03
): number {
  let netWorth = currentNetWorth;
  const years = targetAge - currentAge;

  // Compound at nominal return
  for (let i = 0; i < years; i++) {
    netWorth = netWorth * (1 + nominalReturn) + annualSavings;
  }

  // Discount to present value
  const presentValue = netWorth / Math.pow(1 + inflation, years);

  return presentValue;
}

// Simple bar chart component
interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  isHighlighted?: boolean;
}

function ChartBar({ label, value, maxValue, color, isHighlighted }: ChartBarProps) {
  const barWidth = maxValue > 0 ? Math.max((value / maxValue) * 100, 2) : 2;

  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className={`text-xs ${isHighlighted ? 'text-white font-semibold' : 'text-slate-400'}`}>
          {label}
        </Text>
        <Text className={`text-xs font-medium ${isHighlighted ? 'text-white' : 'text-slate-300'}`}>
          {formatCurrency(value)}
        </Text>
      </View>
      <View className="h-4 bg-slate-700/50 rounded-full overflow-hidden">
        <Animated.View
          entering={FadeIn.delay(300).duration(800)}
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
            height: '100%',
            borderRadius: 100,
          }}
        />
      </View>
    </View>
  );
}

export default function NetWorthTrackerScreen() {
  const router = useRouter();
  const data = useFinanceStore((s) => s.data);
  const spendingLimits = calculateSpendingLimits(data);

  const currentAge = data.age || 30;
  const netWorth = data.netWorth || 0;
  const annualIncome = data.annualIncome || 0;

  // Calculate annual savings (from spending limits savings rate + retirement contributions)
  const monthlyNetSavings = spendingLimits.spendingByIncome.savings;
  const annualSavings = (monthlyNetSavings * 12) + (data.retirementContributions || 0);

  // Get wealth multiplier for current age
  const wealthMultiplier = getValueForAge(WEALTH_MULTIPLIERS, currentAge);

  // Get target net worth based on income
  const targetMultiplier = getValueForAge(NET_WORTH_TARGETS, currentAge);
  const targetNetWorth = annualIncome * targetMultiplier;

  // Get comparison benchmarks
  const averageAmericanNetWorth = getValueForAge(AVERAGE_AMERICAN_NET_WORTH, currentAge);
  const wealthArchitectNetWorth = getValueForAge(WEALTH_ARCHITECT_NET_WORTH, currentAge);

  // Calculate income multiplier achieved
  const currentMultiplier = annualIncome > 0 ? netWorth / annualIncome : 0;

  // Project net worth to age 65
  const projectedNetWorth65 = projectNetWorth(netWorth, annualSavings, currentAge, 65);
  const avgAmericanAt65 = AVERAGE_AMERICAN_NET_WORTH[65];
  const wealthArchitectAt65 = WEALTH_ARCHITECT_NET_WORTH[65];

  // Determine status
  const isAheadOfTarget = netWorth >= targetNetWorth;
  const isWealthArchitect = netWorth >= wealthArchitectNetWorth * 0.8;

  // Find max value for chart scaling
  const chartMaxValue = Math.max(
    netWorth,
    targetNetWorth,
    wealthArchitectNetWorth,
    averageAmericanNetWorth
  ) * 1.1;

  const projectionChartMax = Math.max(
    projectedNetWorth65,
    wealthArchitectAt65,
    avgAmericanAt65
  ) * 1.1;

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
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
              <Text className="text-white text-lg font-bold">Liquid Net Worth</Text>
              <Text className="text-slate-400 text-sm">Investable assets only</Text>
            </View>
          </Animated.View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Current Net Worth Card */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="px-5 mt-5"
            >
              <LinearGradient
                colors={isWealthArchitect ? ['#10b981', '#059669'] : isAheadOfTarget ? ['#3b82f6', '#2563eb'] : ['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 20 }}
              >
                <Text className="text-white/80 text-sm font-medium mb-1">
                  Liquid Net Worth
                </Text>
                <Text className="text-white text-4xl font-bold">
                  {formatCurrencyFull(netWorth)}
                </Text>

                <View className="flex-row items-center mt-2">
                  <Text className="text-white/80 text-sm">Age {currentAge}</Text>
                  <View className="mx-2 w-1 h-1 rounded-full bg-white/50" />
                  <Text className="text-white/80 text-sm">
                    {currentMultiplier.toFixed(1)}x income
                  </Text>
                </View>

                <View className="mt-4 pt-4 border-t border-white/20">
                  <View className="flex-row items-center">
                    <Sparkles size={16} color="#fff" />
                    <Text className="text-white text-sm ml-2 font-medium">
                      Wealth Multiplier: {wealthMultiplier.toFixed(0)}x
                    </Text>
                  </View>
                  <Text className="text-white/70 text-xs mt-1">
                    Every $1 you invest today could become ${wealthMultiplier.toFixed(0)} by age 65
                  </Text>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Status Badge */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              className="px-5 mt-4"
            >
              <View className={`rounded-xl p-4 ${
                isWealthArchitect
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : isAheadOfTarget
                  ? 'bg-blue-500/10 border border-blue-500/30'
                  : 'bg-amber-500/10 border border-amber-500/30'
              }`}>
                <View className="flex-row items-center">
                  {isWealthArchitect ? (
                    <>
                      <Sparkles size={20} color="#10b981" />
                      <Text className="text-emerald-400 font-semibold ml-2">Wealth Architect Status!</Text>
                    </>
                  ) : isAheadOfTarget ? (
                    <>
                      <Target size={20} color="#3b82f6" />
                      <Text className="text-blue-400 font-semibold ml-2">On Track!</Text>
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} color="#f59e0b" />
                      <Text className="text-amber-400 font-semibold ml-2">Building Wealth</Text>
                    </>
                  )}
                </View>
                <Text className="text-slate-400 text-sm mt-2">
                  {isWealthArchitect
                    ? "You're in the top tier of wealth builders for your age!"
                    : isAheadOfTarget
                    ? `You're ahead of the ${targetMultiplier.toFixed(1)}x income target for age ${currentAge}.`
                    : `Target: ${targetMultiplier.toFixed(1)}x income (${formatCurrency(targetNetWorth)}) by age ${currentAge}.`
                  }
                </Text>
              </View>
            </Animated.View>

            {/* Current Age Comparison Chart */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              className="px-5 mt-6"
            >
              <Text className="text-white text-lg font-semibold mb-1">
                Liquid Net Worth at Age {currentAge}
              </Text>
              <Text className="text-slate-400 text-sm mb-4">
                How you compare to benchmarks
              </Text>

              <View className="bg-slate-800/50 rounded-xl p-4">
                <ChartBar
                  label="You"
                  value={netWorth}
                  maxValue={chartMaxValue}
                  color="#10b981"
                  isHighlighted
                />
                <ChartBar
                  label={`Target (${targetMultiplier.toFixed(1)}x income)`}
                  value={targetNetWorth}
                  maxValue={chartMaxValue}
                  color="#3b82f6"
                />
                <ChartBar
                  label="Wealth Architect"
                  value={wealthArchitectNetWorth}
                  maxValue={chartMaxValue}
                  color="#8b5cf6"
                />
                <ChartBar
                  label="Average American"
                  value={averageAmericanNetWorth}
                  maxValue={chartMaxValue}
                  color="#64748b"
                />
              </View>
            </Animated.View>

            {/* Projection to Age 65 */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(500)}
              className="px-5 mt-6"
            >
              <Text className="text-white text-lg font-semibold mb-1">
                Projected Liquid Net Worth at 65
              </Text>
              <Text className="text-slate-400 text-sm mb-4">
                Based on {formatCurrency(annualSavings)}/year savings (today's dollars)
              </Text>

              <View className="bg-slate-800/50 rounded-xl p-4">
                <ChartBar
                  label="Your Projection"
                  value={projectedNetWorth65}
                  maxValue={projectionChartMax}
                  color="#10b981"
                  isHighlighted
                />
                <ChartBar
                  label="Wealth Architect at 65"
                  value={wealthArchitectAt65}
                  maxValue={projectionChartMax}
                  color="#8b5cf6"
                />
                <ChartBar
                  label="Avg American at 65"
                  value={avgAmericanAt65}
                  maxValue={projectionChartMax}
                  color="#64748b"
                />
              </View>
            </Animated.View>

            {/* Net Worth by Decade */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              className="px-5 mt-6"
            >
              <Text className="text-white text-lg font-semibold mb-1">
                Your Liquid Net Worth Trajectory
              </Text>
              <Text className="text-slate-400 text-sm mb-4">
                Projected growth by age
              </Text>

              <View className="bg-slate-800/50 rounded-xl p-4">
                {[30, 40, 50, 60, 65].filter(age => age >= currentAge).map((age, index) => {
                  const projected = age === currentAge
                    ? netWorth
                    : projectNetWorth(netWorth, annualSavings, currentAge, age);
                  const architectTarget = getValueForAge(WEALTH_ARCHITECT_NET_WORTH, age);
                  const isOnArchitectTrack = projected >= architectTarget * 0.8;

                  return (
                    <View
                      key={age}
                      className={`flex-row items-center justify-between py-3 ${
                        index > 0 ? 'border-t border-slate-700/50' : ''
                      }`}
                    >
                      <View>
                        <Text className="text-white font-medium">Age {age}</Text>
                        <Text className="text-slate-500 text-xs">
                          Target: {formatCurrency(annualIncome * getValueForAge(NET_WORTH_TARGETS, age))}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className={`font-semibold ${
                          isOnArchitectTrack ? 'text-emerald-400' : 'text-white'
                        }`}>
                          {formatCurrency(projected)}
                        </Text>
                        <Text className={`text-xs ${
                          isOnArchitectTrack ? 'text-emerald-400/70' : 'text-slate-500'
                        }`}>
                          {isOnArchitectTrack ? 'Architect Track' : `${(projected / annualIncome).toFixed(1)}x income`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </Animated.View>

            {/* Info Section */}
            <Animated.View
              entering={FadeInDown.delay(350).duration(500)}
              className="px-5 mt-6"
            >
              <View className="bg-slate-800/30 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Info size={16} color="#94a3b8" />
                  <Text className="text-slate-400 font-medium ml-2">About These Benchmarks</Text>
                </View>
                <Text className="text-slate-500 text-sm leading-5">
                  Data based on research including a survey of 25,000+ disciplined savers -
                  people who consistently save 20%+ of their income and follow wealth-building habits.
                  The average American data comes from Federal Reserve surveys.
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
