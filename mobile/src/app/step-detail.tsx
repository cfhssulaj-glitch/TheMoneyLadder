import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  ChevronLeft,
  Lightbulb,
  Target,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useFinanceStore, calculateCurrentStep } from '@/lib/finance-store';

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

interface StepContent {
  title: string;
  description: string;
  icon: string;
  definition: string;
  whyItMatters: string;
  howToDoIt: string[];
  tips: string[];
  commonMistakes: string[];
  example: string;
}

const stepDetails: Record<number, StepContent> = {
  1: {
    title: 'Deductibles Covered',
    description: 'Save enough to cover your highest insurance deductible',
    icon: 'shield',
    definition:
      'This is your "starter" emergency fund — a small cash cushion that covers your highest insurance deductible (health, auto, home). It ensures you can pay any out-of-pocket costs if something unexpected happens.',
    whyItMatters:
      "Without this buffer, a single car accident or medical emergency could force you into credit card debt. This step protects you from life's curveballs while you focus on building wealth.",
    howToDoIt: [
      'Find your highest insurance deductible (usually health insurance)',
      'Open a high-yield savings account if you don\'t have one',
      'Set up automatic transfers — even $50/week adds up',
      'Keep this money separate from your checking account',
    ],
    tips: [
      'Most people need $1,000 - $2,500 for this step',
      'A high-yield savings account can earn 4-5% interest',
      "Don't invest this money — it needs to be accessible",
    ],
    commonMistakes: [
      'Skipping this step to pay off debt faster',
      'Keeping the money in a checking account where it gets spent',
      'Using this fund for non-emergencies',
    ],
    example:
      'Sarah has a $1,500 health insurance deductible and a $500 car insurance deductible. She saves $1,500 in a high-yield savings account. When she gets a flat tire, she has cash ready instead of putting it on a credit card.',
  },
  2: {
    title: 'Employer Match',
    description: "Contribute enough to your 401(k) to get your full employer match",
    icon: 'gift',
    definition:
      "Your employer match is literally free money. If your company matches 50% of contributions up to 6% of your salary, contributing 6% means you're getting an instant 50% return on that money.",
    whyItMatters:
      "Not taking the full match is leaving money on the table. This is the highest guaranteed return you'll ever get on an investment. Even with high-interest debt, this step usually comes first because the return is so high.",
    howToDoIt: [
      'Log into your 401(k) provider portal',
      'Find your employer match details (HR can help)',
      'Set your contribution percentage to at least get the full match',
      'Choose target-date funds if you\'re unsure what to invest in',
    ],
    tips: [
      'Common matches: 50% up to 6%, 100% up to 3%, or dollar-for-dollar up to 4%',
      'Some companies have vesting periods — know when the match is fully yours',
      'Increase contributions by 1% each year until you\'re maxing out',
    ],
    commonMistakes: [
      'Not enrolling in the 401(k) at all',
      'Contributing less than the match threshold',
      'Cashing out 401(k) when changing jobs',
    ],
    example:
      'Mike earns $60,000/year. His company matches 100% up to 3%. By contributing 3% ($1,800/year), he gets $1,800 free from his employer. That\'s a 100% return instantly.',
  },
  3: {
    title: 'High-Interest Debt',
    description: 'Pay off credit cards and loans with interest rates above 6%',
    icon: 'credit-card',
    definition:
      'High-interest debt is any debt charging more than 6% interest — typically credit cards (15-25%), personal loans, and some car loans. This debt grows faster than most investments can earn.',
    whyItMatters:
      "Paying off a 20% credit card is like earning a guaranteed 20% return on your money. You can't reliably beat that in the stock market. This debt is an emergency.",
    howToDoIt: [
      'List all debts with their interest rates',
      'Pay minimums on everything except the highest-rate debt',
      'Throw every extra dollar at the highest-rate debt first (avalanche method)',
      'Once paid off, roll that payment to the next highest',
    ],
    tips: [
      'Consider balance transfer cards with 0% intro APR',
      'Call creditors to negotiate lower rates',
      'Sell things you don\'t need to accelerate payoff',
      'The "debt snowball" (smallest balance first) works too if you need motivation wins',
    ],
    commonMistakes: [
      'Only paying minimums while investing',
      'Consolidating debt then running up cards again',
      'Taking on new debt while paying off old debt',
    ],
    example:
      'Lisa has a $5,000 credit card at 22% APR and a $3,000 card at 18% APR. She pays minimum on the 18% card and puts $500/month toward the 22% card. After paying off the first card, she moves that $500 to the second card.',
  },
  4: {
    title: 'Emergency Fund',
    description: 'Build 3-6 months of expenses in liquid savings',
    icon: 'umbrella',
    definition:
      'Your full emergency fund covers 3-6 months of essential expenses (rent, utilities, food, insurance). This protects you from job loss, medical emergencies, or major unexpected costs.',
    whyItMatters:
      "Without this safety net, any major setback could derail your entire financial plan. It gives you options — you can negotiate at work, take time to find the right job, or handle emergencies without going into debt.",
    howToDoIt: [
      'Calculate your monthly essential expenses (not discretionary)',
      'Multiply by 3 (stable job) to 6 (variable income/single earner)',
      'Automate transfers to a separate high-yield savings account',
      'Build it up over 6-12 months — no rush',
    ],
    tips: [
      'Keep it in a high-yield savings account (4-5% APR)',
      'Don\'t invest this money — you need it accessible',
      'Consider 6+ months if you\'re self-employed or in an unstable industry',
      'Replenish it immediately if you have to use it',
    ],
    commonMistakes: [
      'Keeping too much in emergency savings (beyond 6 months)',
      'Investing the emergency fund in stocks',
      'Using it for non-emergencies like vacations',
    ],
    example:
      'Tom\'s essential monthly expenses are $4,000. He builds a $15,000 emergency fund (about 4 months). When he\'s unexpectedly laid off, he has time to find the right job instead of taking the first offer.',
  },
  5: {
    title: 'Roth IRA / HSA',
    description: 'Max out tax-advantaged accounts for growth',
    icon: 'trending-up',
    definition:
      'A Roth IRA lets your money grow tax-free forever (you pay taxes now, but never on withdrawals). An HSA (Health Savings Account) is triple tax-advantaged: tax-deductible, grows tax-free, and withdrawals for medical expenses are tax-free.',
    whyItMatters:
      'These accounts offer incredible tax benefits that get better the longer you use them. Starting early means decades of tax-free growth. The HSA is particularly powerful — it\'s the only account with triple tax advantages.',
    howToDoIt: [
      'Open a Roth IRA at Fidelity, Schwab, or Vanguard',
      'Contribute up to $7,000/year (2024 limit)',
      'If eligible, contribute to HSA: $4,150 individual, $8,300 family (2024)',
      'Invest in low-cost index funds within these accounts',
    ],
    tips: [
      'Pay for medical expenses out of pocket and let HSA grow',
      'Keep medical receipts — you can reimburse yourself from HSA anytime later',
      'If income is too high for Roth IRA, look into "backdoor Roth"',
      'Prioritize HSA if you have a high-deductible health plan',
    ],
    commonMistakes: [
      'Using HSA as a spending account instead of an investment account',
      'Not investing the money inside these accounts',
      'Missing contribution deadlines (April 15 for previous year)',
    ],
    example:
      'Amy contributes $7,000 to her Roth IRA and $4,150 to her HSA each year. In 30 years, her Roth could grow to $500,000+ that she\'ll never pay taxes on. Her HSA grows too, ready for medical expenses in retirement.',
  },
  6: {
    title: 'Max Retirement',
    description: 'Max out your 401(k) contributions',
    icon: 'piggy-bank',
    definition:
      'After getting your match and funding Roth/HSA, now you go back to max out your 401(k) completely — $23,000/year in 2024. This reduces your taxable income now and builds serious wealth for retirement.',
    whyItMatters:
      'The tax savings are significant: at a 24% tax rate, maxing your 401(k) saves you $5,520 in taxes. Plus the money grows tax-deferred for decades. This step accelerates your path to financial independence.',
    howToDoIt: [
      'Increase your 401(k) contribution percentage',
      'Aim to hit $23,000 by year-end (about $1,917/month)',
      'If you can\'t max it immediately, increase by 1-2% each year',
      'If 50+, you can contribute an extra $7,500 as catch-up',
    ],
    tips: [
      'Some employers offer Roth 401(k) — consider splitting contributions',
      'If your plan has bad fund options, max Roth IRA first',
      'Many employers allow automatic contribution increases',
    ],
    commonMistakes: [
      'Stopping contributions during market downturns',
      'Borrowing from 401(k) for non-emergencies',
      'Ignoring high expense ratios in plan options',
    ],
    example:
      'David is 35 and maxes his 401(k) at $23,000/year. If the market returns 7% annually, he\'ll have about $1.7 million by age 65 — just from his 401(k) alone.',
  },
  7: {
    title: 'Plan for Big Goals',
    description: "Save for kids' education, dream purchases, legacy",
    icon: 'star',
    definition:
      'This step is about building wealth for major future goals: children\'s education (529 plans), dream purchases (vacation home, travel), charitable giving, and leaving a legacy for the next generation.',
    whyItMatters:
      "With your retirement on track and high-interest debt gone, you can now focus on what matters most: funding your kids' education debt-free, pursuing dreams, giving generously, and building a legacy that reflects your values.",
    howToDoIt: [
      'Open 529 accounts for children\'s education',
      'Set up separate savings goals for major purchases',
      'Consider donor-advised funds for charitable giving',
      'Work with an estate attorney for legacy planning',
    ],
    tips: [
      '529 plans grow tax-free for education expenses',
      'You can contribute to others\' 529s (grandkids, nieces, nephews)',
      'Consider Roth conversions for tax-efficient wealth transfer',
      'Update beneficiaries on all accounts regularly',
    ],
    commonMistakes: [
      'Prioritizing kids\' college over your own retirement',
      'Not having proper estate documents in place',
      'Lifestyle inflation eating into this savings capacity',
    ],
    example:
      'The Johnsons fully fund their retirement and now contribute $500/month to each child\'s 529 plan. They\'re also building a donor-advised fund for charitable giving in retirement.',
  },
  8: {
    title: 'Eliminate All Debt',
    description: 'Pay off mortgage and other low-interest loans early',
    icon: 'home',
    definition:
      'Low-interest debt (under 6%) includes most mortgages, some student loans, and car loans. Paying these off provides guaranteed returns and the psychological freedom of being completely debt-free.',
    whyItMatters:
      "Mathematically, investing may beat a 4% mortgage. But being completely debt-free provides peace of mind and flexibility. You could weather any storm without payments hanging over you.",
    howToDoIt: [
      'Continue investing for retirement',
      'Add extra payments to your mortgage principal',
      'Consider biweekly payments (26 half-payments = 13 monthly payments)',
      'Pay off mortgage before retirement for lower fixed costs',
    ],
    tips: [
      'Check for prepayment penalties before paying extra',
      'Even $100/month extra can cut years off a mortgage',
      'If your mortgage rate is very low (under 3%), investing more may make sense',
      'This step is more personal preference than math',
    ],
    commonMistakes: [
      'Prioritizing mortgage payoff over retirement savings',
      'Refinancing to cash out equity and restart the clock',
      'Making extra payments instead of first maxing tax-advantaged accounts',
    ],
    example:
      'The Smiths have a $300,000 mortgage at 4.5%. By paying an extra $400/month, they\'ll pay it off 8 years early and save $87,000 in interest.',
  },
  9: {
    title: 'Wealth Acceleration',
    description: 'Save 25%+ of gross income for long-term growth',
    icon: 'rocket',
    definition:
      'The final step is wealth acceleration: saving 25% or more of your gross income, investing the excess in taxable brokerage accounts. Debt-free and fully funded, this is where your wealth really takes off.',
    whyItMatters:
      'Tax-advantaged accounts have limits. To build serious wealth or achieve financial independence faster, you need to go beyond them. Taxable brokerage accounts offer flexibility — no age restrictions, no contribution limits.',
    howToDoIt: [
      'Calculate 25% of your gross income',
      'Subtract your retirement contributions',
      'Invest the difference in a taxable brokerage account',
      'Use tax-efficient funds: index funds, ETFs, municipal bonds',
    ],
    tips: [
      'Hold investments for 1+ year for lower capital gains tax',
      'Consider tax-loss harvesting to offset gains',
      'Dividend-paying stocks are less tax-efficient in taxable accounts',
      'Real estate can also be part of this phase',
    ],
    commonMistakes: [
      'Picking individual stocks instead of diversified funds',
      'Trading frequently (triggers short-term capital gains)',
      'Forgetting to rebalance periodically',
    ],
    example:
      'Jennifer earns $150,000 and saves 25% ($37,500). After maxing her 401(k) ($23,000) and Roth IRA ($7,000), she invests $7,500 in a taxable brokerage account in low-cost index funds.',
  },
};

export default function StepDetailScreen() {
  const router = useRouter();
  const { step } = useLocalSearchParams<{ step: string }>();
  const stepNumber = parseInt(step ?? '1', 10);
  const stepData = stepDetails[stepNumber];

  const data = useFinanceStore((s) => s.data);
  const emergencyFund = useFinanceStore((s) => s.data.emergencyFund);
  const highestDeductible = useFinanceStore((s) => s.data.highestDeductible);
  const currentStep = calculateCurrentStep(data);
  const isCompleted = stepNumber < currentStep;
  const isCurrent = stepNumber === currentStep;

  if (!stepData) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <Text className="text-white">Step not found</Text>
      </View>
    );
  }

  const IconComponent = iconMap[stepData.icon] || Shield;

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
            className="flex-row items-center px-4 py-3"
          >
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center mr-3"
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-slate-400 text-sm">Step {stepNumber} of 9</Text>
              <Text className="text-white text-lg font-bold" numberOfLines={1}>
                {stepData.title}
              </Text>
            </View>
            <View
              className={`px-3 py-1 rounded-full ${
                isCompleted
                  ? 'bg-emerald-500/20'
                  : isCurrent
                  ? 'bg-amber-500/20'
                  : 'bg-slate-700'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  isCompleted
                    ? 'text-emerald-400'
                    : isCurrent
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {isCompleted ? 'Complete' : isCurrent ? 'Current' : 'Upcoming'}
              </Text>
            </View>
          </Animated.View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="px-5 mt-2 mb-6"
            >
              <LinearGradient
                colors={
                  isCompleted
                    ? ['#10b981', '#059669']
                    : isCurrent
                    ? ['#f59e0b', '#d97706']
                    : ['#475569', '#334155']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 20, padding: 24 }}
              >
                <View className="flex-row items-center mb-4">
                  <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center mr-4">
                    <IconComponent size={28} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white/80 text-sm">Step {stepNumber}</Text>
                    <Text className="text-white text-xl font-bold">
                      {stepData.title}
                    </Text>
                  </View>
                </View>
                <Text className="text-white/90 text-base leading-6">
                  {stepData.description}
                </Text>
              </LinearGradient>
            </Animated.View>

            {/* Personalized Progress for Step 1 */}
            {stepNumber === 1 && (
              <Animated.View
                entering={FadeInDown.delay(125).duration(500)}
                className="px-5 mb-5"
              >
                <View className="flex-row items-center mb-3">
                  <Shield size={18} color="#3b82f6" />
                  <Text className="text-white font-semibold text-base ml-2">
                    Your Progress
                  </Text>
                </View>
                <View className="bg-slate-800/50 rounded-xl p-4">
                  {highestDeductible > 0 ? (
                    <>
                      <View className="flex-row justify-between mb-3">
                        <Text className="text-slate-400">Highest Deductible</Text>
                        <Text className="text-white font-semibold">
                          ${highestDeductible.toLocaleString()}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-3">
                        <Text className="text-slate-400">Emergency Fund</Text>
                        <Text className="text-white font-semibold">
                          ${emergencyFund.toLocaleString()}
                        </Text>
                      </View>
                      <View className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                        <View
                          className={`h-full rounded-full ${
                            emergencyFund >= highestDeductible ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{
                            width: `${Math.min((emergencyFund / highestDeductible) * 100, 100)}%`,
                          }}
                        />
                      </View>
                      <Text
                        className={`text-sm ${
                          emergencyFund >= highestDeductible ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {emergencyFund >= highestDeductible
                          ? 'You have your deductible covered!'
                          : `$${(highestDeductible - emergencyFund).toLocaleString()} more to cover your deductible`}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-slate-400 text-center">
                      Set your highest deductible in Profile to track your progress here.
                    </Text>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Definition */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(500)}
              className="px-5 mb-5"
            >
              <View className="flex-row items-center mb-3">
                <Target size={18} color="#10b981" />
                <Text className="text-white font-semibold text-base ml-2">
                  What Is This?
                </Text>
              </View>
              <View className="bg-slate-800/50 rounded-xl p-4">
                <Text className="text-slate-300 text-base leading-6">
                  {stepData.definition}
                </Text>
              </View>
            </Animated.View>

            {/* Why It Matters */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              className="px-5 mb-5"
            >
              <View className="flex-row items-center mb-3">
                <Lightbulb size={18} color="#f59e0b" />
                <Text className="text-white font-semibold text-base ml-2">
                  Why It Matters
                </Text>
              </View>
              <View className="bg-slate-800/50 rounded-xl p-4">
                <Text className="text-slate-300 text-base leading-6">
                  {stepData.whyItMatters}
                </Text>
              </View>
            </Animated.View>

            {/* How To Do It */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(500)}
              className="px-5 mb-5"
            >
              <View className="flex-row items-center mb-3">
                <CheckCircle2 size={18} color="#3b82f6" />
                <Text className="text-white font-semibold text-base ml-2">
                  How To Do It
                </Text>
              </View>
              <View className="bg-slate-800/50 rounded-xl p-4">
                {stepData.howToDoIt.map((item, index) => (
                  <View key={index} className="flex-row mb-2 last:mb-0">
                    <View className="w-6 h-6 rounded-full bg-blue-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-blue-400 text-xs font-bold">
                        {index + 1}
                      </Text>
                    </View>
                    <Text className="text-slate-300 text-base leading-6 flex-1">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Pro Tips */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              className="px-5 mb-5"
            >
              <View className="flex-row items-center mb-3">
                <Star size={18} color="#a855f7" />
                <Text className="text-white font-semibold text-base ml-2">
                  Pro Tips
                </Text>
              </View>
              <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                {stepData.tips.map((tip, index) => (
                  <View key={index} className="flex-row mb-2 last:mb-0">
                    <Text className="text-purple-400 mr-2">•</Text>
                    <Text className="text-slate-300 text-base leading-6 flex-1">
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Common Mistakes */}
            <Animated.View
              entering={FadeInDown.delay(350).duration(500)}
              className="px-5 mb-5"
            >
              <View className="flex-row items-center mb-3">
                <AlertCircle size={18} color="#e07a6e" />
                <Text className="text-white font-semibold text-base ml-2">
                  Common Mistakes
                </Text>
              </View>
              <View className="bg-slate-800/50 rounded-xl p-4">
                {stepData.commonMistakes.map((mistake, index) => (
                  <View key={index} className="flex-row mb-2 last:mb-0">
                    <Text className="text-red-400/70 mr-2">✕</Text>
                    <Text className="text-slate-400 text-base leading-6 flex-1">
                      {mistake}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Real Example */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(500)}
              className="px-5 mb-5"
            >
              <View className="flex-row items-center mb-3">
                <Gift size={18} color="#10b981" />
                <Text className="text-white font-semibold text-base ml-2">
                  Real Example
                </Text>
              </View>
              <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <Text className="text-slate-300 text-base leading-6 italic">
                  "{stepData.example}"
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
