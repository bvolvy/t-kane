import { Grill, Payment, Client, Withdrawal, Loan, LoanPayment, Transfer, Deposit } from '../types';

export const generatePayments = (grill: Grill): Payment[] => {
  const payments: Payment[] = [];
  for (let day = 1; day <= grill.duration; day++) {
    payments.push({
      day,
      amount: day * grill.baseAmount,
      paid: false,
    });
  }
  return payments;
};

export const calculateTotalExpected = (client: Client, grills: Grill[]): number => {
  if (!client.grillId) return 0;
  
  const grill = grills.find((g) => g.id === client.grillId);
  if (!grill) return 0;
  
  let total = 0;
  for (let day = 1; day <= grill.duration; day++) {
    total += day * grill.baseAmount;
  }
  return total;
};

export const calculateGrillTotal = (grill: Grill): number => {
  let total = 0;
  for (let day = 1; day <= grill.duration; day++) {
    total += day * grill.baseAmount;
  }
  return total;
};

export const calculateAdminEarnings = (grill: Grill): number => {
  const totalAmount = calculateGrillTotal(grill);
  return (totalAmount * grill.adminPercentage) / 100;
};

export const calculateAmountPaid = (payments: Payment[]): number => {
  return payments.reduce((total, payment) => {
    return payment.paid ? total + payment.amount : total;
  }, 0);
};

export const calculateTotalWithdrawals = (withdrawals: Withdrawal[] = []): number => {
  return withdrawals.reduce((total, withdrawal) => {
    // Only count non-reversed withdrawals
    if (!withdrawal.reversed) {
      return total + withdrawal.amount;
    }
    return total;
  }, 0);
};

export const calculateTotalDeposits = (deposits: Deposit[] = []): number => {
  return deposits.reduce((total, deposit) => {
    // Only count non-reversed deposits
    if (!deposit.reversed) {
      return total + deposit.amount;
    }
    return total;
  }, 0);
};

export const calculateTotalTransfers = (transfers: Transfer[] = [], clientId: string): number => {
  return transfers.reduce((total, transfer) => {
    // Skip reversed transfers
    if (transfer.reversed) {
      return total;
    }
    
    if (transfer.fromClientId === clientId) {
      return total - transfer.amount; // Outgoing transfer
    }
    if (transfer.toClientId === clientId) {
      return total + transfer.amount; // Incoming transfer
    }
    return total;
  }, 0);
};

export const calculateAvailableBalance = (client: Client, grills: Grill[]): number => {
  const amountPaid = calculateAmountPaid(client.payments);
  const totalWithdrawn = calculateTotalWithdrawals(client.withdrawals);
  const totalDeposits = calculateTotalDeposits(client.deposits);
  const totalTransfers = calculateTotalTransfers(client.transfers, client.id);
  return amountPaid + totalDeposits - totalWithdrawn + totalTransfers;
};

export const calculateBalanceRemaining = (client: Client, grills: Grill[]): number => {
  const totalExpected = calculateTotalExpected(client, grills);
  const amountPaid = calculateAmountPaid(client.payments);
  return totalExpected - amountPaid;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const calculateProgressPercentage = (client: Client, grills: Grill[]): number => {
  const totalExpected = calculateTotalExpected(client, grills);
  const amountPaid = calculateAmountPaid(client.payments);
  return totalExpected > 0 ? (amountPaid / totalExpected) * 100 : 0;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const isPlanCompleted = (client: Client): boolean => {
  if (!client.grillId) return false;
  return client.payments.every((payment) => payment.paid);
};

export const calculateLoanTotalAmount = (loan: Loan): number => {
  const totalInterest = (loan.amount * loan.interestRate) / 100;
  return loan.amount + totalInterest;
};

export const calculateLoanPaymentSummary = (loan: Loan) => {
  const principalPaid = loan.payments
    .filter(p => p.type === 'principal')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const interestPaid = loan.payments
    .filter(p => p.type === 'interest')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalInterestExpected = (loan.amount * loan.interestRate) / 100;
  const remainingPrincipal = loan.amount - principalPaid;
  const remainingInterest = totalInterestExpected - interestPaid;
  const totalPaid = principalPaid + interestPaid;
  const totalAmount = loan.amount + totalInterestExpected;
  const remainingTotal = remainingPrincipal + remainingInterest;

  return {
    principalPaid,
    interestPaid,
    remainingPrincipal,
    remainingInterest,
    totalPaid,
    totalAmount,
    remainingTotal,
    totalInterestExpected,
    progress: (totalPaid / totalAmount) * 100
  };
};