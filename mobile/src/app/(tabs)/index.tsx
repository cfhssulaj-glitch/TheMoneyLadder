import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Shield,
  Gift,
  CreditCard,
  Umbrella,
  TrendingUp,
  PiggyBank,
  Rocket,
  Home,
  Star,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  Wallet,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFinanceStore, MONEY_LADDER_STEPS, calculateCurrentStep } from '@/lib/finance-store';

const iconMap: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  shield: Shield,
  gift: Gift,
  'credit-card': CreditCard,
  umbrella: Umbrella,
  'trending-up': TrendingUp,
  'piggy-bank': PiggyBank,
  rocket: Rocket,
  home: Home,
  star: Star,
};

const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${Math.round(amount / 1000)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Money Guy Wealth Multiplier by age
const WEALTH_MULTIPLIERS: Record<number, number> = {
  20: 88, 25: 54, 30: 33, 35: 20, 40: 12, 45: 7.5, 50: 4.5, 55: 2.8, 60: 1.7, 65: 1,
};

function getWealthMultiplier(age: number): number {
  const ages = Object.keys(WEALTH_MULTIPLIERS).map(Number).sort((a, b) => a - b);
  if (age <= ages[0]) return WEALTH_MULTIPLIERS[ages[0]];
  if (age >= ages[ages.length - 1]) return WEALTH_MULTIPLIERS[ages[ages.length - 1]];

  for (let i = 0; i < ages.length - 1; i++) {
    if (age >= ages[i] && age <= ages[i + 1]) {
      const ratio = (age - ages[i]) / (ages[i + 1] - ages[i]);
      return WEALTH_MULTIPLIERS[ages[i]] + (WEALTH_MULTIPLIERS[ages[i + 1]] - WEALTH_MULTIPLIERS[ages[i]]) * ratio;
    }
  }
  return 1;
}

export default function DashboardScreen() {
  const router = useRouter();
  const data = useFinanceStore((s) => s.data);
  const hasCompletedOnboarding = useFinanceStore((s) => s.hasCompletedOnboarding);

  const currentStep = calculateCurrentStep(data);
  const progressPercentage = ((currentStep - 1) / 9) * 100;

  if (!hasCompletedOnboarding) {
    return (
      <View className="flex-1 bg-slate-950">
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          style={{ flex: 1 }}
        >
          <SafeAreaView className="flex-1 justify-center px-6">
            <Animated.View entering={FadeInUp.delay(100).duration(600)}>
              <View className="items-center mb-8">
                <View className="w-20 h-20 rounded-full bg-emerald-500/20 items-center justify-center mb-4">
                  <Target size={40} color="#10b981" />
                </View>
                <Text className="text-white text-3xl font-bold text-center">
                  The Money Ladder
                </Text>
                <Text className="text-slate-400 text-center mt-2 text-base">
                  Your path to financial freedom
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(300).duration(600)}>
              <View className="bg-slate-800/50 rounded-2xl p-5 mb-6">
                <Text className="text-white text-lg font-semibold mb-2">
                  9-Step Wealth Building System
                </Text>
                <Text className="text-slate-400 text-sm leading-5">
                  Follow a proven 9-step system to build wealth the right way, one rung at a time. Track your net worth and see if you're on pace to become a Wealth Architect.
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(400).duration(600)}>
              <View className="bg-slate-800/50 rounded-2xl p-5 mb-8">
                <Text className="text-white text-lg font-semibold mb-2">
                  Smart Spending Rules
                </Text>
                <Text className="text-slate-400 text-sm leading-5">
                  Know exactly how much you can spend guilt-free based on your income and net worth. Use the debt calculator to plan your payoff strategy.
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(600)}>
              <Pressable
                onPress={() => router.push('/(tabs)/profile')}
                className="active:opacity-80"
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, padding: 18 }}
                >
                  <Text className="text-white text-center text-lg font-semibold">
                    Get Started
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
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
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="px-5 pt-4 pb-4"
            >
              <Text className="text-slate-400 text-sm">Your Progress</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                The Money Ladder
              </Text>

              {/* Progress Bar */}
              <View className="mt-4 bg-slate-800 rounded-full h-3 overflow-hidden">
                <Animated.View
                  entering={FadeInDown.delay(300).duration(800)}
                  style={{ width: `${progressPercentage}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </View>
              <Text className="text-slate-500 text-sm mt-2">
                Step {currentStep} of 9 • {Math.round(progressPercentage)}% complete
              </Text>
            </Animated.View>

            {/* Net Worth Tracker Button - Moved to top */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              className="px-5 mb-6"
            >
              <Pressable
                onPress={() => router.push('/net-worth-tracker')}
                className="active:opacity-80"
              >
                <View className="rounded-xl p-4 bg-emerald-500/10 border border-emerald-500/30">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-4">
                      <Wallet size={20} color="#10b981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-emerald-400 font-medium">
                        Liquid Net Worth
                      </Text>
                      <Text className="text-slate-500 text-xs">
                        Age {data.age || 30} • {getWealthMultiplier(data.age || 30).toFixed(0)}x multiplier
                      </Text>
                    </View>
                    <Text className="text-emerald-400 text-lg font-semibold mr-2">
                      {formatCurrency(data.netWorth || 0)}
                    </Text>
                    <ChevronRight size={20} color="#10b981" />
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Current Step Highlight */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              className="px-5 mb-6"
            >
              <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center mr-3">
                    <Text className="text-white font-bold">{currentStep}</Text>
                  </View>
                  <Text className="text-emerald-400 font-semibold flex-1">
                    Current Focus
                  </Text>
                </View>
                <Text className="text-white text-lg font-semibold mb-1">
                  {MONEY_LADDER_STEPS[currentStep - 1].title}
                </Text>
                <Text className="text-slate-400 text-sm">
                  {MONEY_LADDER_STEPS[currentStep - 1].description}
                </Text>
              </View>
            </Animated.View>

            {/* All Steps */}
            <View className="px-5">
              <Text className="text-white text-lg font-semibold mb-4">
                All 9 Steps
              </Text>

              {MONEY_LADDER_STEPS.map((step, index) => {
                const IconComponent = iconMap[step.icon] || Circle;
                const isCompleted = step.step < currentStep;
                const isCurrent = step.step === currentStep;
                const isFuture = step.step > currentStep;

                return (
                  <Animated.View
                    key={step.step}
                    entering={FadeInDown.delay(300 + index * 50).duration(400)}
                  >
                    <Pressable
                      onPress={() => router.push(`/step-detail?step=${step.step}`)}
                      className={`mb-3 rounded-xl p-4 flex-row items-center active:opacity-80 ${
                        isCurrent
                          ? 'bg-slate-800 border border-emerald-500/50'
                          : isCompleted
                          ? 'bg-slate-800/50'
                          : 'bg-slate-800/30'
                      }`}
                    >
                      <View
                        className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : isCurrent
                            ? 'bg-emerald-500/20'
                            : 'bg-slate-700'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={20} color="#fff" />
                        ) : (
                          <IconComponent
                            size={20}
                            color={isCurrent ? '#10b981' : '#64748b'}
                          />
                        )}
                      </View>

                      <View className="flex-1">
                        <Text
                          className={`font-semibold ${
                            isFuture ? 'text-slate-500' : 'text-white'
                          }`}
                        >
                          {step.step}. {step.title}
                        </Text>
                        <Text
                          className={`text-sm mt-0.5 ${
                            isFuture ? 'text-slate-600' : 'text-slate-400'
                          }`}
                          numberOfLines={1}
                        >
                          {step.target}
                        </Text>
                      </View>

                      <ChevronRight
                        size={20}
                        color={isFuture ? '#334155' : '#64748b'}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
