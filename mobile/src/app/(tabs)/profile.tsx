import { View, Text, ScrollView, TextInput, Pressable, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Shield,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Home,
  HelpCircle,
  X,
  Car,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useFinanceStore, FinancialData, getDebtSummary } from '@/lib/finance-store';
import { hasEntitlement, isRevenueCatEnabled } from '@/lib/revenuecatClient';

// Help text definitions for each input field
const FIELD_HELP_TEXT: Record<string, { title: string; description: string }> = {
  age: {
    title: 'Your Age',
    description: 'Your current age is used to calculate your wealth multiplier (how much each dollar you invest today could grow by age 65) and to compare your net worth against Money Guy benchmarks for your age group.',
  },
  annualIncome: {
    title: 'Annual Gross Income',
    description: 'Your total yearly income before taxes and deductions. Include your salary, wages, bonuses, and any other regular income sources. This is used to calculate your monthly budget and savings targets.',
  },
  taxRate: {
    title: 'Effective Tax Rate',
    description: 'Your effective (overall) tax rate - the percentage of your total income that goes to taxes. This includes federal, state, and local taxes combined. If unsure, use the common rates below as a guide based on your income level.',
  },
  netWorth: {
    title: 'Liquid Net Worth',
    description: 'Investable assets (cash, savings, retirement, brokerage) minus non-mortgage debts (credit cards, student loans, car loans, medical debt). Do NOT include home equity or car value.',
  },
  emergencyFund: {
    title: 'Emergency Fund',
    description: 'Money set aside in a savings account for unexpected expenses like medical bills, car repairs, or job loss. Ideally kept in a high-yield savings account for easy access. The goal is 3-6 months of essential expenses.',
  },
  retirementContributions: {
    title: '401(k) Contributions',
    description: 'The amount you contribute annually to your employer-sponsored 401(k) retirement plan. For 2024, the maximum contribution is $23,000 (or $30,500 if age 50+). Contributions are typically pre-tax, reducing your taxable income.',
  },
  employerMatch: {
    title: 'Employer Match %',
    description: 'The percentage of your contribution that your employer matches. For example, if your employer matches 100% up to 4%, they will add $1 for every $1 you contribute, up to 4% of your salary. This is free money!',
  },
  employerMatchLimit: {
    title: 'Match Up To % of Salary',
    description: 'The maximum percentage of your salary that your employer will match. If this is 6% and you earn $100,000, your employer will match contributions up to $6,000. Contributing at least this amount captures all the free money.',
  },
  rothIraContributions: {
    title: 'Roth IRA Contributions',
    description: 'Annual contributions to your Roth IRA. For 2024, the limit is $7,000 ($8,000 if 50+). Roth contributions are after-tax but grow tax-free, and withdrawals in retirement are tax-free. Great for long-term wealth building.',
  },
  hsaContributions: {
    title: 'HSA Contributions',
    description: 'Annual contributions to your Health Savings Account (if you have a high-deductible health plan). For 2024, limits are $4,150 individual or $8,300 family. Triple tax advantage: tax-deductible, grows tax-free, tax-free withdrawals for medical expenses.',
  },
  taxableInvestments: {
    title: 'Taxable Investments',
    description: 'Annual contributions to non-retirement investment accounts (brokerage accounts). These have no contribution limits but gains are taxable. Useful once you\'ve maxed out tax-advantaged accounts, or for goals before retirement.',
  },
  highestDeductible: {
    title: 'Highest Deductible',
    description: 'The largest deductible amount across all your insurance policies (health, auto, home). Your emergency fund should cover at least this amount to handle any unexpected insurance claim without financial stress.',
  },
};

// Help Tooltip Component
function HelpModal({
  visible,
  onClose,
  title,
  description,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 justify-center items-center px-6"
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeIn.duration(200)}
            className="bg-slate-800 rounded-2xl p-5 shadow-xl border border-slate-700 w-full max-w-sm"
          >
            <View className="flex-row items-start justify-between mb-3">
              <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3">
                <HelpCircle size={20} color="#10b981" />
              </View>
              <Text className="text-white text-lg font-semibold flex-1">{title}</Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center"
              >
                <X size={16} color="#94a3b8" />
              </Pressable>
            </View>
            <Text className="text-slate-300 text-base leading-6">{description}</Text>
            <Pressable
              onPress={onClose}
              className="mt-5 bg-slate-700 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium">Got it</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface InputFieldProps {
  label: string;
  value: number;
  field: keyof FinancialData;
  placeholder?: string;
  prefix?: string;
}

function InputField({ label, value, field, placeholder = '0', prefix = '$' }: InputFieldProps) {
  const updateField = useFinanceStore((s) => s.updateField);
  const [showHelp, setShowHelp] = useState(false);
  const helpText = FIELD_HELP_TEXT[field];

  const handleChange = (text: string) => {
    const numericValue = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    updateField(field, numericValue);
  };

  const handleHelpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowHelp(true);
  };

  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Text className="text-slate-400 text-sm flex-1">{label}</Text>
        {helpText && (
          <Pressable
            onPress={handleHelpPress}
            className="w-6 h-6 rounded-full bg-slate-700/60 items-center justify-center ml-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text className="text-slate-400 text-xs font-semibold">?</Text>
          </Pressable>
        )}
      </View>
      <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
        <Text className="text-slate-500 text-lg mr-1">{prefix}</Text>
        <TextInput
          className="flex-1 text-white text-lg"
          value={value > 0 ? value.toLocaleString() : ''}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          keyboardType="numeric"
          returnKeyType="done"
        />
      </View>
      {helpText && (
        <HelpModal
          visible={showHelp}
          onClose={() => setShowHelp(false)}
          title={helpText.title}
          description={helpText.description}
        />
      )}
    </View>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsOpen(!isOpen);
        }}
        className="flex-row items-center bg-slate-800/50 rounded-xl p-4 active:bg-slate-800"
      >
        {icon}
        <Text className="text-white font-semibold flex-1 ml-3">{title}</Text>
        {isOpen ? (
          <ChevronUp size={20} color="#64748b" />
        ) : (
          <ChevronDown size={20} color="#64748b" />
        )}
      </Pressable>
      {isOpen && (
        <View className="mt-3 px-2">
          {children}
        </View>
      )}
    </View>
  );
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

function DebtInputSection() {
  const debtItems = useFinanceStore((s) => s.data.debtItems) || [];
  const addDebtItem = useFinanceStore((s) => s.addDebtItem);
  const removeDebtItem = useFinanceStore((s) => s.removeDebtItem);
  const monthlyDebtPayment = useFinanceStore((s) => s.data.monthlyDebtPayment);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDebtName, setNewDebtName] = useState('');
  const [newDebtBalance, setNewDebtBalance] = useState('');
  const [newDebtInterestRate, setNewDebtInterestRate] = useState('');
  const [newDebtMinPayment, setNewDebtMinPayment] = useState('');
  const [isMortgage, setIsMortgage] = useState(false);
  const [isCarDebt, setIsCarDebt] = useState(false);

  const summary = getDebtSummary(debtItems);

  const handleAddDebt = () => {
    if (!newDebtName.trim() || !newDebtBalance.trim()) return;

    addDebtItem({
      name: newDebtName.trim(),
      balance: parseFloat(newDebtBalance.replace(/[^0-9.]/g, '')) || 0,
      interestRate: parseFloat(newDebtInterestRate.replace(/[^0-9.]/g, '')) || 0,
      minimumPayment: parseFloat(newDebtMinPayment.replace(/[^0-9.]/g, '')) || 0,
      isMortgage,
      isCarDebt: !isMortgage && isCarDebt, // Can't be both mortgage and car debt
    });

    setNewDebtName('');
    setNewDebtBalance('');
    setNewDebtInterestRate('');
    setNewDebtMinPayment('');
    setIsMortgage(false);
    setIsCarDebt(false);
    setShowAddForm(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveDebt = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeDebtItem(id);
  };

  return (
    <View className="mb-4">
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsOpen(!isOpen);
        }}
        className="flex-row items-center bg-slate-800/50 rounded-xl p-4 active:bg-slate-800"
      >
        <CreditCard size={20} color="#ef4444" />
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold">Debt</Text>
          {debtItems.length > 0 && (
            <Text className="text-slate-500 text-xs">
              {debtItems.length} debt{debtItems.length !== 1 ? 's' : ''} • {formatCurrency(summary.totalBalance)} total
            </Text>
          )}
        </View>
        {isOpen ? (
          <ChevronUp size={20} color="#64748b" />
        ) : (
          <ChevronDown size={20} color="#64748b" />
        )}
      </Pressable>

      {isOpen && (
        <View className="mt-3 px-2">
          {/* Summary Card */}
          {debtItems.length > 0 && (
            <View className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-sm">Total Balance</Text>
                <Text className="text-red-400 font-semibold">{formatCurrency(summary.totalBalance)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-400 text-sm">Monthly Payment (excl. mortgage)</Text>
                <Text className="text-red-400 font-semibold">{formatCurrency(monthlyDebtPayment)}</Text>
              </View>
              {summary.weightedAverageInterest > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-slate-400 text-sm">Avg Interest Rate</Text>
                  <Text className="text-amber-400 font-semibold">{summary.weightedAverageInterest}%</Text>
                </View>
              )}
            </View>
          )}

          {/* Debt List */}
          {debtItems.map((debt, index) => (
            <Animated.View
              key={debt.id}
              entering={FadeIn.delay(index * 50).duration(300)}
              className="bg-slate-800/50 rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                    debt.isMortgage ? 'bg-blue-500/20' : debt.isCarDebt ? 'bg-cyan-500/20' : 'bg-red-500/20'
                  }`}>
                    {debt.isMortgage ? (
                      <Home size={16} color="#3b82f6" />
                    ) : debt.isCarDebt ? (
                      <Car size={16} color="#06b6d4" />
                    ) : (
                      <CreditCard size={16} color="#f87171" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">{debt.name}</Text>
                    {debt.isMortgage && (
                      <Text className="text-blue-400 text-xs">Mortgage</Text>
                    )}
                    {debt.isCarDebt && (
                      <Text className="text-cyan-400 text-xs">Car Debt</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => handleRemoveDebt(debt.id)}
                  className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center"
                >
                  <Trash2 size={14} color="#ef4444" />
                </Pressable>
              </View>
              <View className="flex-row justify-between">
                <View>
                  <Text className="text-slate-500 text-xs">Balance</Text>
                  <Text className="text-white">{formatCurrency(debt.balance)}</Text>
                </View>
                <View>
                  <Text className="text-slate-500 text-xs">Interest</Text>
                  <Text className="text-amber-400">{debt.interestRate}%</Text>
                </View>
                <View>
                  <Text className="text-slate-500 text-xs">Min. Payment</Text>
                  <Text className="text-white">{formatCurrency(debt.minimumPayment)}/mo</Text>
                </View>
              </View>
            </Animated.View>
          ))}

          {/* Add Debt Form */}
          {showAddForm ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              className="bg-slate-800 rounded-xl p-4 mb-3"
            >
              <TextInput
                value={newDebtName}
                onChangeText={setNewDebtName}
                placeholder="Debt name (e.g., Credit Card, Car Loan)"
                placeholderTextColor="#64748b"
                className="bg-slate-700 rounded-xl px-4 py-3 text-white mb-3"
              />

              <View className="flex-row mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-slate-400 text-xs mb-1 ml-1">Balance</Text>
                  <View className="flex-row items-center bg-slate-700 rounded-xl px-4 py-3">
                    <Text className="text-slate-500 mr-1">$</Text>
                    <TextInput
                      value={newDebtBalance}
                      onChangeText={setNewDebtBalance}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      className="flex-1 text-white"
                    />
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-slate-400 text-xs mb-1 ml-1">Interest Rate</Text>
                  <View className="flex-row items-center bg-slate-700 rounded-xl px-4 py-3">
                    <TextInput
                      value={newDebtInterestRate}
                      onChangeText={setNewDebtInterestRate}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="decimal-pad"
                      className="flex-1 text-white"
                    />
                    <Text className="text-slate-500 ml-1">%</Text>
                  </View>
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-slate-400 text-xs mb-1 ml-1">Minimum Payment</Text>
                <View className="flex-row items-center bg-slate-700 rounded-xl px-4 py-3">
                  <Text className="text-slate-500 mr-1">$</Text>
                  <TextInput
                    value={newDebtMinPayment}
                    onChangeText={setNewDebtMinPayment}
                    placeholder="0"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    className="flex-1 text-white"
                  />
                  <Text className="text-slate-500">/month</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-3 mb-3">
                <View className="flex-row items-center">
                  <Home size={18} color="#3b82f6" />
                  <Text className="text-white ml-2">This is a mortgage</Text>
                </View>
                <Switch
                  value={isMortgage}
                  onValueChange={(val) => {
                    setIsMortgage(val);
                    if (val) setIsCarDebt(false); // Can't be both
                  }}
                  trackColor={{ false: '#334155', true: '#3b82f6' }}
                  thumbColor="#fff"
                />
              </View>

              <View className={`flex-row items-center justify-between py-3 mb-3 ${isMortgage ? 'opacity-40' : ''}`}>
                <View className="flex-row items-center">
                  <Car size={18} color="#06b6d4" />
                  <Text className="text-white ml-2">This is a car loan</Text>
                </View>
                <Switch
                  value={isCarDebt}
                  onValueChange={setIsCarDebt}
                  trackColor={{ false: '#334155', true: '#06b6d4' }}
                  thumbColor="#fff"
                  disabled={isMortgage}
                />
              </View>

              <View className="flex-row">
                <Pressable
                  onPress={() => {
                    setShowAddForm(false);
                    setNewDebtName('');
                    setNewDebtBalance('');
                    setNewDebtInterestRate('');
                    setNewDebtMinPayment('');
                    setIsMortgage(false);
                    setIsCarDebt(false);
                  }}
                  className="flex-1 py-3 mr-2 rounded-xl bg-slate-700 items-center"
                >
                  <Text className="text-slate-300 font-medium">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddDebt}
                  className="flex-1 py-3 ml-2 rounded-xl bg-red-500 items-center"
                >
                  <Text className="text-white font-medium">Add Debt</Text>
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAddForm(true);
              }}
              className="bg-slate-800/50 border border-dashed border-slate-600 rounded-xl p-4 flex-row items-center justify-center"
            >
              <Plus size={20} color="#64748b" />
              <Text className="text-slate-400 ml-2 font-medium">Add a Debt</Text>
            </Pressable>
          )}

          <View className="bg-slate-800/30 rounded-xl p-3 mt-3">
            <Text className="text-slate-500 text-sm">
              Mortgage payments are tracked separately since housing is already budgeted. Car loan payments are subtracted from your transportation budget.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function ProfileScreen() {
  const data = useFinanceStore((s) => s.data);
  const updateField = useFinanceStore((s) => s.updateField);
  const hasCompletedOnboarding = useFinanceStore((s) => s.hasCompletedOnboarding);
  const setOnboardingComplete = useFinanceStore((s) => s.setOnboardingComplete);
  const isPremium = useFinanceStore((s) => s.isPremium);
  const setPremium = useFinanceStore((s) => s.setPremium);
  const resetData = useFinanceStore((s) => s.resetData);

  // Check premium status on mount and when returning from paywall
  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    if (!isRevenueCatEnabled()) return;

    const result = await hasEntitlement('premium');
    if (result.ok && result.data) {
      setPremium(true);
    }
  };

  const handleSave = async () => {
    // Data is automatically saved via Zustand persist - just need to mark onboarding complete
    // Premium check is only for additional features, not for saving local data
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!hasCompletedOnboarding) {
      setOnboardingComplete();
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all your financial information. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            resetData();
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ flex: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="px-5 pt-4 pb-6"
            >
              <Text className="text-slate-400 text-sm">Your Profile</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                Financial Information
              </Text>
              <Text className="text-slate-500 text-sm mt-2">
                Enter your numbers to get personalized guidance
              </Text>
            </Animated.View>

            <View className="px-5">
              {/* Income Section - Always Open */}
              <Animated.View entering={FadeInDown.delay(150).duration(500)}>
                <CollapsibleSection
                  title="Income"
                  icon={<DollarSign size={20} color="#10b981" />}
                  defaultOpen={true}
                >
                  <InputField
                    label="Your Age"
                    value={data.age}
                    field="age"
                    placeholder="30"
                    prefix=""
                  />
                  <InputField
                    label="Annual Gross Income"
                    value={data.annualIncome}
                    field="annualIncome"
                    placeholder="75,000"
                  />
                  <InputField
                    label="Effective Tax Rate"
                    value={data.taxRate}
                    field="taxRate"
                    placeholder="22"
                    prefix="%"
                  />
                  {/* Tax Rate Presets */}
                  <View className="mb-4">
                    <Text className="text-slate-500 text-xs mb-2">Common effective rates (tap to select):</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[
                        { rate: 15, label: '15%', desc: '<$50k' },
                        { rate: 18, label: '18%', desc: '$50-75k' },
                        { rate: 22, label: '22%', desc: '$75-100k' },
                        { rate: 25, label: '25%', desc: '$100-150k' },
                        { rate: 28, label: '28%', desc: '$150-200k' },
                        { rate: 32, label: '32%', desc: '$200k+' },
                      ].map((preset) => (
                        <Pressable
                          key={preset.rate}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            updateField('taxRate', preset.rate);
                          }}
                          className={`px-3 py-2 rounded-lg ${
                            data.taxRate === preset.rate
                              ? 'bg-emerald-500/20 border border-emerald-500/50'
                              : 'bg-slate-700/50'
                          }`}
                        >
                          <Text className={`text-sm font-medium ${
                            data.taxRate === preset.rate ? 'text-emerald-400' : 'text-white'
                          }`}>
                            {preset.label}
                          </Text>
                          <Text className="text-slate-500 text-xs">{preset.desc}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  <View className="bg-slate-800/30 rounded-xl p-3 mb-2">
                    <Text className="text-slate-500 text-sm">
                      Monthly gross: <Text className="text-slate-400">${Math.round(data.monthlyIncome).toLocaleString()}</Text>
                    </Text>
                    <Text className="text-slate-500 text-sm mt-1">
                      Monthly net: <Text className="text-emerald-400">${Math.round(data.monthlyNetIncome || data.monthlyIncome * (1 - data.taxRate / 100)).toLocaleString()}</Text>
                    </Text>
                  </View>
                </CollapsibleSection>
              </Animated.View>

              {/* Net Worth Section */}
              <Animated.View entering={FadeInDown.delay(200).duration(500)}>
                <CollapsibleSection
                  title="Liquid Net Worth"
                  icon={<TrendingUp size={20} color="#3b82f6" />}
                  defaultOpen={true}
                >
                  <InputField
                    label="Liquid Net Worth (Investable Assets)"
                    value={data.netWorth}
                    field="netWorth"
                    placeholder="50,000"
                  />
                  <View className="bg-slate-800/30 rounded-xl p-3 mb-2">
                    <Text className="text-slate-500 text-sm">
                      Daily spending (÷1000): <Text className="text-amber-400">${Math.round(data.netWorth / 1000)}</Text>
                    </Text>
                  </View>
                </CollapsibleSection>
              </Animated.View>

              {/* Savings Section */}
              <Animated.View entering={FadeInDown.delay(250).duration(500)}>
                <CollapsibleSection
                  title="Savings & Investments"
                  icon={<PiggyBank size={20} color="#8b5cf6" />}
                >
                  <InputField
                    label="Emergency Fund"
                    value={data.emergencyFund}
                    field="emergencyFund"
                    placeholder="10,000"
                  />
                  <InputField
                    label="Annual 401(k) Contributions"
                    value={data.retirementContributions}
                    field="retirementContributions"
                    placeholder="6,000"
                  />
                  <InputField
                    label="Employer Match %"
                    value={data.employerMatch}
                    field="employerMatch"
                    placeholder="4"
                    prefix="%"
                  />
                  <InputField
                    label="Match Up To % of Salary"
                    value={data.employerMatchLimit}
                    field="employerMatchLimit"
                    placeholder="6"
                    prefix="%"
                  />
                  <InputField
                    label="Roth IRA Contributions (Annual)"
                    value={data.rothIraContributions}
                    field="rothIraContributions"
                    placeholder="7,000"
                  />
                  <InputField
                    label="HSA Contributions (Annual)"
                    value={data.hsaContributions}
                    field="hsaContributions"
                    placeholder="4,150"
                  />
                  <InputField
                    label="Taxable Investments (Annual)"
                    value={data.taxableInvestments}
                    field="taxableInvestments"
                    placeholder="5,000"
                  />
                </CollapsibleSection>
              </Animated.View>

              {/* Debt Section */}
              <Animated.View entering={FadeInDown.delay(300).duration(500)}>
                <DebtInputSection />
              </Animated.View>

              {/* Insurance Section */}
              <Animated.View entering={FadeInDown.delay(350).duration(500)}>
                <CollapsibleSection
                  title="Insurance"
                  icon={<Shield size={20} color="#f59e0b" />}
                >
                  <InputField
                    label="Highest Deductible"
                    value={data.highestDeductible}
                    field="highestDeductible"
                    placeholder="1,500"
                  />
                  <View className="bg-slate-800/30 rounded-xl p-3 mb-4">
                    <Text className="text-slate-500 text-sm">
                      Your highest insurance deductible (health, auto, home).{' '}
                      <Text className="text-amber-400">Step 1</Text> is complete when your emergency fund covers this.
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between py-3">
                    <Text className="text-white">Health Insurance</Text>
                    <Switch
                      value={data.hasHealthInsurance}
                      onValueChange={(value) => updateField('hasHealthInsurance', value)}
                      trackColor={{ false: '#334155', true: '#10b981' }}
                      thumbColor="#fff"
                    />
                  </View>
                  <View className="flex-row items-center justify-between py-3">
                    <Text className="text-white">Life Insurance</Text>
                    <Switch
                      value={data.hasLifeInsurance}
                      onValueChange={(value) => updateField('hasLifeInsurance', value)}
                      trackColor={{ false: '#334155', true: '#10b981' }}
                      thumbColor="#fff"
                    />
                  </View>
                  <View className="flex-row items-center justify-between py-3">
                    <Text className="text-white">Disability Insurance</Text>
                    <Switch
                      value={data.hasDisabilityInsurance}
                      onValueChange={(value) => updateField('hasDisabilityInsurance', value)}
                      trackColor={{ false: '#334155', true: '#10b981' }}
                      thumbColor="#fff"
                    />
                  </View>
                </CollapsibleSection>
              </Animated.View>

              {/* Action Buttons */}
              <Animated.View entering={FadeInDown.delay(400).duration(500)} className="mt-6">
                <Pressable
                  onPress={handleSave}
                  className="active:opacity-80"
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Save size={20} color="#fff" />
                    <Text className="text-white text-center text-lg font-semibold ml-2">
                      {hasCompletedOnboarding ? 'Save Changes' : 'Get Started'}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {hasCompletedOnboarding && (
                  <Pressable
                    onPress={handleReset}
                    className="mt-4 py-4 active:opacity-50"
                  >
                    <View className="flex-row items-center justify-center">
                      <RotateCcw size={16} color="#ef4444" />
                      <Text className="text-red-500 text-center ml-2">
                        Reset All Data
                      </Text>
                    </View>
                  </Pressable>
                )}
              </Animated.View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
