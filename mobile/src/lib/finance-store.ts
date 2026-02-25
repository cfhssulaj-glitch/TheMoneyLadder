import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface DebtItem {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
  isMortgage?: boolean;
  isCarDebt?: boolean;
}

export interface FinancialData {
  // Income
  annualIncome: number;
  monthlyIncome: number;
  taxRate: number; // Effective tax rate as percentage (e.g., 22 for 22%)
  monthlyNetIncome: number; // Calculated: monthlyIncome * (1 - taxRate/100)

  // Personal Info
  age: number; // User's current age for wealth multiplier calculations

  // Net Worth Components
  netWorth: number;

  // Savings & Investments
  emergencyFund: number;
  retirementContributions: number; // Annual 401k/IRA contributions
  employerMatch: number; // Percentage employer matches
  employerMatchLimit: number; // Up to what percentage

  // Debt
  highInterestDebt: number; // Credit cards, etc (>6% interest)
  studentLoans: number;
  carLoans: number;
  mortgage: number;

  // Detailed Debt Items
  debtItems: DebtItem[];

  // Insurance
  hasHealthInsurance: boolean;
  hasLifeInsurance: boolean;
  hasDisabilityInsurance: boolean;
  highestDeductible: number; // Highest insurance deductible (health, auto, home)

  // Goals
  hsaContributions: number;
  rothIraContributions: number;
  taxableInvestments: number;

  // User Monthly Expenses
  userExpenses: {
    housing: number;
    transportation: number;
    food: number;
    utilities: number;
    insurance: number;
    savings: number;
    funMoney: number;
    miscellaneous: number;
  };

  // Debt Payment
  monthlyDebtPayment: number;
}

interface FinanceStore {
  data: FinancialData;
  hasCompletedOnboarding: boolean;
  isPremium: boolean;
  updateField: <K extends keyof FinancialData>(field: K, value: FinancialData[K]) => void;
  updateUserExpense: (category: keyof FinancialData['userExpenses'], value: number) => void;
  addDebtItem: (item: Omit<DebtItem, 'id'>) => void;
  updateDebtItem: (id: string, updates: Partial<DebtItem>) => void;
  removeDebtItem: (id: string) => void;
  setOnboardingComplete: () => void;
  setPremium: (value: boolean) => void;
  resetData: () => void;
  resetFinancialDataOnly: () => void;
}

const defaultData: FinancialData = {
  annualIncome: 0,
  monthlyIncome: 0,
  taxRate: 22, // Default to 22% (common effective rate)
  monthlyNetIncome: 0,
  age: 30, // Default age for calculations
  netWorth: 0,
  emergencyFund: 0,
  retirementContributions: 0,
  employerMatch: 0,
  employerMatchLimit: 0,
  highInterestDebt: 0,
  studentLoans: 0,
  carLoans: 0,
  mortgage: 0,
  debtItems: [],
  hasHealthInsurance: false,
  hasLifeInsurance: false,
  hasDisabilityInsurance: false,
  highestDeductible: 0,
  hsaContributions: 0,
  rothIraContributions: 0,
  taxableInvestments: 0,
  userExpenses: {
    housing: 0,
    transportation: 0,
    food: 0,
    utilities: 0,
    insurance: 0,
    savings: 0,
    funMoney: 0,
    miscellaneous: 0,
  },
  monthlyDebtPayment: 0,
};

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set) => ({
      data: defaultData,
      hasCompletedOnboarding: false,
      isPremium: false,
      updateField: (field, value) =>
        set((state) => {
          const newData = { ...state.data, [field]: value };

          // Auto-calculate monthly income and net income when annual income changes
          if (field === 'annualIncome') {
            const monthlyGross = (value as number) / 12;
            newData.monthlyIncome = monthlyGross;
            newData.monthlyNetIncome = monthlyGross * (1 - state.data.taxRate / 100);
          }

          // Recalculate net income when tax rate changes
          if (field === 'taxRate') {
            newData.monthlyNetIncome = state.data.monthlyIncome * (1 - (value as number) / 100);
          }

          return { data: newData };
        }),
      updateUserExpense: (category, value) =>
        set((state) => ({
          data: {
            ...state.data,
            userExpenses: {
              ...state.data.userExpenses,
              [category]: value,
            },
          },
        })),
      addDebtItem: (item) =>
        set((state) => {
          const newItem: DebtItem = {
            ...item,
            id: Date.now().toString(),
          };
          const newDebtItems = [...(state.data.debtItems || []), newItem];
          // Auto-calculate total debt and monthly payment
          const nonMortgagePayment = newDebtItems
            .filter((d) => !d.isMortgage)
            .reduce((sum, d) => sum + d.minimumPayment, 0);
          return {
            data: {
              ...state.data,
              debtItems: newDebtItems,
              highInterestDebt: newDebtItems
                .filter((d) => d.interestRate > 6 && !d.isMortgage)
                .reduce((sum, d) => sum + d.balance, 0),
              monthlyDebtPayment: nonMortgagePayment,
            },
          };
        }),
      updateDebtItem: (id, updates) =>
        set((state) => {
          const newDebtItems = (state.data.debtItems || []).map((item) =>
            item.id === id ? { ...item, ...updates } : item
          );
          const nonMortgagePayment = newDebtItems
            .filter((d) => !d.isMortgage)
            .reduce((sum, d) => sum + d.minimumPayment, 0);
          return {
            data: {
              ...state.data,
              debtItems: newDebtItems,
              highInterestDebt: newDebtItems
                .filter((d) => d.interestRate > 6 && !d.isMortgage)
                .reduce((sum, d) => sum + d.balance, 0),
              monthlyDebtPayment: nonMortgagePayment,
            },
          };
        }),
      removeDebtItem: (id) =>
        set((state) => {
          const newDebtItems = (state.data.debtItems || []).filter((item) => item.id !== id);
          const nonMortgagePayment = newDebtItems
            .filter((d) => !d.isMortgage)
            .reduce((sum, d) => sum + d.minimumPayment, 0);
          return {
            data: {
              ...state.data,
              debtItems: newDebtItems,
              highInterestDebt: newDebtItems
                .filter((d) => d.interestRate > 6 && !d.isMortgage)
                .reduce((sum, d) => sum + d.balance, 0),
              monthlyDebtPayment: nonMortgagePayment,
            },
          };
        }),
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),
      setPremium: (value: boolean) => set({ isPremium: value }),
      resetData: () => set({ data: defaultData, hasCompletedOnboarding: false, isPremium: false }),
      resetFinancialDataOnly: () => set({ data: defaultData, hasCompletedOnboarding: false }),
    }),
    {
      name: 'finance-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Money Ladder Steps - 9-step system to build wealth
export const MONEY_LADDER_STEPS = [
  {
    step: 1,
    title: 'Deductibles Covered',
    description: 'Save enough to cover your highest insurance deductible',
    target: 'Have 1-2 months of expenses saved',
    icon: 'shield',
  },
  {
    step: 2,
    title: 'Employer Match',
    description: 'Contribute enough to get your full employer 401(k) match',
    target: "Don't leave free money on the table",
    icon: 'gift',
  },
  {
    step: 3,
    title: 'High-Interest Debt',
    description: 'Pay off credit cards and loans with interest rates above 6%',
    target: 'Eliminate debt costing you more than investments earn',
    icon: 'credit-card',
  },
  {
    step: 4,
    title: 'Emergency Fund',
    description: 'Build 3-6 months of expenses in liquid savings',
    target: 'Financial security for unexpected events',
    icon: 'umbrella',
  },
  {
    step: 5,
    title: 'Roth IRA / HSA',
    description: 'Max out tax-advantaged accounts for growth',
    target: 'Roth IRA: $7,000/yr, HSA: $4,150/yr (2024)',
    icon: 'trending-up',
  },
  {
    step: 6,
    title: 'Max Retirement',
    description: 'Max out your 401(k) contributions',
    target: '$23,000/year (2024 limit)',
    icon: 'piggy-bank',
  },
  {
    step: 7,
    title: 'Plan for Big Goals',
    description: "Save for kids' education, dream purchases, legacy",
    target: 'Build wealth for future milestones',
    icon: 'star',
  },
  {
    step: 8,
    title: 'Eliminate All Debt',
    description: 'Pay off mortgage and other low-interest loans early',
    target: 'Become completely debt-free',
    icon: 'home',
  },
  {
    step: 9,
    title: 'Wealth Acceleration',
    description: 'Save 25%+ of gross income for long-term growth',
    target: 'Taxable brokerage accounts for flexibility',
    icon: 'rocket',
  },
];

// Calculate which Money Ladder step the user is on
export function calculateCurrentStep(data: FinancialData): number {
  const monthlyExpenses = data.monthlyIncome * 0.7; // Estimate 70% of income as expenses

  // Step 1: Deductibles covered - emergency fund must cover highest deductible
  const deductibleTarget = data.highestDeductible > 0 ? data.highestDeductible : monthlyExpenses * 1;
  if (data.emergencyFund < deductibleTarget) {
    return 1;
  }

  // Step 2: Getting employer match
  const maxMatchContribution = (data.annualIncome * data.employerMatchLimit) / 100;
  if (data.retirementContributions < maxMatchContribution && data.employerMatch > 0) {
    return 2;
  }

  // Step 3: High-interest debt
  if (data.highInterestDebt > 0) {
    return 3;
  }

  // Step 4: Emergency fund (3-6 months)
  if (data.emergencyFund < monthlyExpenses * 3) {
    return 4;
  }

  // Step 5: Roth IRA / HSA
  const rothLimit = 7000;
  const hsaLimit = 4150;
  if (data.rothIraContributions < rothLimit || data.hsaContributions < hsaLimit) {
    return 5;
  }

  // Step 6: Max retirement
  const maxRetirement = 23000;
  if (data.retirementContributions < maxRetirement) {
    return 6;
  }

  // Step 7: Plan for Big Goals (529s, major purchases, legacy) - this is ongoing
  // For now, we'll consider this step in progress once step 6 is complete
  // Users can track their progress manually

  // Step 8: Low-interest debt (mortgage, etc.)
  if (data.studentLoans > 0 || data.carLoans > 0 || data.mortgage > 0) {
    return 8;
  }

  // Step 9: Wealth Acceleration (25% savings rate)
  const targetSavings = data.annualIncome * 0.25;
  const totalSavings = data.retirementContributions + data.rothIraContributions + data.hsaContributions + data.taxableInvestments;
  if (totalSavings < targetSavings) {
    return 9;
  }

  // All steps complete - stay on step 9
  return 9;
}

// Smart Spending Rules
export function calculateSpendingLimits(data: FinancialData) {
  // Use net income (after taxes) for spending calculations
  const monthlyNetIncome = data.monthlyNetIncome || data.monthlyIncome * (1 - data.taxRate / 100);
  const netWorth = data.netWorth;
  const monthlyDebtPayment = data.monthlyDebtPayment;

  // Daily spending based on net worth (net worth / 10,000 = daily fun money)
  const dailySpendingByNetWorth = netWorth / 10000;

  // Calculate fun money after debt payments
  const baseFunMoney = monthlyNetIncome * 0.10;
  const baseMiscellaneous = monthlyNetIncome * 0.10;
  const adjustedFunMoney = Math.max(0, baseFunMoney + baseMiscellaneous - monthlyDebtPayment);

  // Monthly spending categories by net income percentage
  // Note: Net income is AFTER taxes and typically after 401k/HSA deductions
  // So savings here represents additional cash savings (emergency fund, Roth IRA, taxable)
  // Insurance here is mainly auto, renters/home, and any post-tax insurance premiums
  const spendingByIncome = {
    housing: monthlyNetIncome * 0.28, // 28% max on housing (rent/mortgage + property tax + HOA)
    transportation: monthlyNetIncome * 0.12, // 12% on transport (car payment, gas, insurance, maintenance)
    food: monthlyNetIncome * 0.12, // 12% on food (groceries + dining out)
    utilities: monthlyNetIncome * 0.06, // 6% on utilities (electric, gas, water, internet, phone)
    insurance: monthlyNetIncome * 0.04, // 4% on post-tax insurance (auto, renters/home, life if not employer-paid)
    savings: monthlyNetIncome * 0.08, // 8% additional cash savings (after 401k/HSA already deducted from gross)
    funMoney: adjustedFunMoney / 2, // Split remaining between fun and misc
    miscellaneous: adjustedFunMoney / 2,
  };

  // Adjust daily spending by net worth for debt payments too
  const dailyDebtImpact = monthlyDebtPayment / 30;
  const adjustedDailySpending = Math.max(0, dailySpendingByNetWorth - dailyDebtImpact);

  return {
    dailySpendingByNetWorth: adjustedDailySpending,
    spendingByIncome,
    weeklyFunMoney: adjustedDailySpending * 7,
    monthlyFunMoney: spendingByIncome.funMoney,
    monthlyNetIncome, // Return this so UI can display it
  };
}

// Calculate debt payoff projection for a single debt
export interface DebtPayoffProjection {
  debtId: string;
  name: string;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  totalInterestPaid: number;
  monthsToPayoff: number;
  payoffDate: Date;
  isMortgage: boolean;
}

export function calculateDebtPayoff(debt: DebtItem): DebtPayoffProjection {
  const { id, name, balance, interestRate, minimumPayment, isMortgage } = debt;

  if (balance <= 0 || minimumPayment <= 0) {
    return {
      debtId: id,
      name,
      originalBalance: balance,
      interestRate,
      minimumPayment,
      totalInterestPaid: 0,
      monthsToPayoff: 0,
      payoffDate: new Date(),
      isMortgage: isMortgage ?? false,
    };
  }

  const monthlyRate = interestRate / 100 / 12;
  let remainingBalance = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 360; // 30 years max

  while (remainingBalance > 0 && months < maxMonths) {
    const interestCharge = remainingBalance * monthlyRate;
    totalInterest += interestCharge;

    const principalPayment = Math.min(minimumPayment - interestCharge, remainingBalance);

    // Check if payment covers at least the interest
    if (minimumPayment <= interestCharge) {
      // Payment doesn't cover interest - debt will never be paid off
      months = maxMonths;
      break;
    }

    remainingBalance -= principalPayment;
    months++;
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);

  return {
    debtId: id,
    name,
    originalBalance: balance,
    interestRate,
    minimumPayment,
    totalInterestPaid: Math.round(totalInterest),
    monthsToPayoff: months,
    payoffDate,
    isMortgage: isMortgage ?? false,
  };
}

// Calculate projections for all debts
export function calculateAllDebtPayoffs(debtItems: DebtItem[]): DebtPayoffProjection[] {
  return debtItems.map(calculateDebtPayoff);
}

// Get summary stats for all debts
export function getDebtSummary(debtItems: DebtItem[]) {
  const allDebts = debtItems || [];
  const nonMortgageDebts = allDebts.filter((d) => !d.isMortgage);

  const totalBalance = allDebts.reduce((sum, d) => sum + d.balance, 0);
  const nonMortgageBalance = nonMortgageDebts.reduce((sum, d) => sum + d.balance, 0);

  const totalMinPayment = allDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
  const nonMortgageMinPayment = nonMortgageDebts.reduce((sum, d) => sum + d.minimumPayment, 0);

  // Weighted average interest rate
  const weightedInterest = nonMortgageBalance > 0
    ? nonMortgageDebts.reduce((sum, d) => sum + (d.balance * d.interestRate), 0) / nonMortgageBalance
    : 0;

  return {
    totalBalance,
    nonMortgageBalance,
    totalMinPayment,
    nonMortgageMinPayment,
    weightedAverageInterest: Math.round(weightedInterest * 10) / 10,
    debtCount: allDebts.length,
    nonMortgageCount: nonMortgageDebts.length,
  };
}

// Get total monthly car debt payments
export function getCarDebtPayments(debtItems: DebtItem[]): number {
  const allDebts = debtItems || [];
  return allDebts
    .filter((d) => d.isCarDebt)
    .reduce((sum, d) => sum + d.minimumPayment, 0);
}
