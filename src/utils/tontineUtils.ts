import { TontineGroup, TontineMember, TontineContribution } from '../types';
import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';

export const calculateTotalContributions = (group: TontineGroup): number => {
  return group.members.reduce((total, member) => {
    return total + member.contributions.reduce((sum, contribution) => {
      return contribution.status === 'paid' ? sum + contribution.amount : sum;
    }, 0);
  }, 0);
};

export const calculateMemberProgress = (member: TontineMember): number => {
  const paidContributions = member.contributions.filter(c => c.status === 'paid').length;
  return (paidContributions / member.contributions.length) * 100;
};

export const calculateNextPayoutDate = (
  startDate: Date,
  interval: TontineGroup['interval'],
  position: number
): Date => {
  let date = startDate;
  for (let i = 0; i < position; i++) {
    switch (interval) {
      case 'daily':
        date = addDays(date, 1);
        break;
      case 'weekly':
        date = addWeeks(date, 1);
        break;
      case 'monthly':
        date = addMonths(date, 1);
        break;
      case 'yearly':
        date = addYears(date, 1);
        break;
    }
  }
  return date;
};

export const generateContributionSchedule = (
  startDate: Date,
  amount: number,
  memberCount: number,
  interval: TontineGroup['interval']
): TontineContribution[] => {
  const contributions: TontineContribution[] = [];
  let currentDate = startDate;

  for (let i = 0; i < memberCount; i++) {
    contributions.push({
      id: crypto.randomUUID(),
      amount,
      date: currentDate.toISOString(),
      periodNumber: i + 1,
      status: 'pending'
    });

    switch (interval) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      case 'yearly':
        currentDate = addYears(currentDate, 1);
        break;
    }
  }

  return contributions;
};

export const checkPayoutEligibility = (group: TontineGroup, memberId: string): boolean => {
  const member = group.members.find(m => m.id === memberId);
  if (!member || member.hasPaidOut) return false;

  // Check if it's this member's turn (based on payout order)
  const currentDate = new Date();
  if (!isAfter(currentDate, new Date(member.payoutDate!))) return false;

  // Check if all members have paid their contributions for this period
  return group.members.every(m => 
    m.contributions.some(c => 
      c.periodNumber === member.payoutOrder && c.status === 'paid'
    )
  );
};

export const validateTontineGroup = (group: TontineGroup): string[] => {
  const errors: string[] = [];

  if (group.members.length !== group.memberCount) {
    errors.push('Member count does not match the required number of members');
  }

  const uniqueOrders = new Set(group.members.map(m => m.payoutOrder));
  if (uniqueOrders.size !== group.members.length) {
    errors.push('Duplicate payout orders found');
  }

  const uniqueClients = new Set(group.members.map(m => m.clientId));
  if (uniqueClients.size !== group.members.length) {
    errors.push('Duplicate clients found');
  }

  group.members.forEach(member => {
    if (member.contributions.length !== group.memberCount) {
      errors.push(`Invalid contribution count for member ${member.id}`);
    }
  });

  return errors;
};