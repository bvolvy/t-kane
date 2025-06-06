import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, Client, Grill, Payment, Withdrawal, Loan, LoanPayment, Transfer, AdminProfile, Notification, TontineGroup, Deposit } from '../types';
import { generatePayments } from '../utils/grillUtils';
import { useAuth } from './AuthContext';

type Action =
  | { type: 'SET_CLIENTS'; payload: Client[] }
  | { type: 'ADD_CLIENT'; payload: Client }
  | { type: 'UPDATE_CLIENT'; payload: Client }
  | { type: 'DELETE_CLIENT'; payload: string }
  | { type: 'SET_GRILLS'; payload: Grill[] }
  | { type: 'ADD_GRILL'; payload: Grill }
  | { type: 'UPDATE_GRILL'; payload: Grill }
  | { type: 'DELETE_GRILL'; payload: string }
  | { type: 'SET_CURRENT_CLIENT'; payload: Client | null }
  | { type: 'SET_CURRENT_GRILL'; payload: Grill | null }
  | { type: 'SET_CURRENT_LOAN'; payload: { loan: Loan | null; clientId: string | null } }
  | { type: 'UPDATE_PAYMENT'; payload: { clientId: string; day: number; paid: boolean } }
  | { type: 'ADD_WITHDRAWAL'; payload: { clientId: string; withdrawal: Withdrawal } }
  | { type: 'ADD_DEPOSIT'; payload: { clientId: string; deposit: Deposit } }
  | { type: 'ADD_TRANSFER'; payload: Transfer }
  | { type: 'REVERSE_TRANSACTION'; payload: { 
      clientId: string; 
      transactionId: string; 
      type: 'withdrawal' | 'deposit' | 'transfer';
      note: string;
    }}
  | { type: 'ADD_LOAN'; payload: { clientId: string; loan: Loan } }
  | { type: 'DELETE_LOAN'; payload: { clientId: string; loanId: string } }
  | { type: 'UPDATE_LOAN_STATUS'; payload: { clientId: string; loanId: string; status: Loan['status'] } }
  | { type: 'ADD_LOAN_PAYMENT'; payload: { clientId: string; loanId: string; payment: LoanPayment } }
  | { type: 'RENEW_CLIENT_GRILL'; payload: { clientId: string; startDate: string } }
  | { type: 'UPDATE_ADMIN_PROFILE'; payload: AdminProfile }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'ADD_TONTINE_GROUP'; payload: TontineGroup }
  | { type: 'UPDATE_TONTINE_GROUP'; payload: TontineGroup }
  | { type: 'DELETE_TONTINE_GROUP'; payload: string }
  | { type: 'SET_CURRENT_TONTINE_GROUP'; payload: TontineGroup | null }
  | { type: 'UPDATE_TONTINE_CONTRIBUTION'; payload: { 
      groupId: string; 
      memberId: string; 
      contributionId: string; 
      status: 'paid' | 'pending';
    }}
  | { type: 'LOAD_ORGANIZATION_DATA'; payload: Partial<AppState> };

const defaultGrills: Grill[] = [
  {
    id: '1',
    name: 'Basic Plan',
    baseAmount: 3,
    duration: 90,
    description: '$3 per day over 90 days',
    adminPercentage: 10,
  },
  {
    id: '2',
    name: 'Standard Plan',
    baseAmount: 5,
    duration: 90,
    description: '$5 per day over 90 days',
    adminPercentage: 10,
  },
  {
    id: '3',
    name: 'Premium Plan',
    baseAmount: 10,
    duration: 90,
    description: '$10 per day over 90 days',
    adminPercentage: 10,
  },
];

const initialState: AppState = {
  clients: [],
  grills: defaultGrills,
  currentClient: null,
  currentGrill: null,
  currentLoan: null,
  adminProfile: {
    name: 'Admin User',
    email: 'admin@tkane.com',
    role: 'System Administrator',
    lastLogin: new Date().toISOString()
  },
  notifications: [],
  tontineGroups: [],
  currentTontineGroup: null
};

const loadSavedState = (organizationId: string): Partial<AppState> => {
  try {
    const savedState = localStorage.getItem(`appState_${organizationId}`);
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        clients: Array.isArray(parsedState.clients) ? parsedState.clients : [],
        grills: Array.isArray(parsedState.grills) ? parsedState.grills : defaultGrills,
        tontineGroups: Array.isArray(parsedState.tontineGroups) ? parsedState.tontineGroups : [],
        adminProfile: parsedState.adminProfile || initialState.adminProfile,
        notifications: Array.isArray(parsedState.notifications) ? parsedState.notifications : []
      };
    }
  } catch (error) {
    console.error('Error loading saved state:', error);
  }
  return {};
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

const saveState = (state: AppState, organizationId: string) => {
  try {
    const stateToSave = {
      clients: state.clients,
      grills: state.grills,
      tontineGroups: state.tontineGroups,
      adminProfile: state.adminProfile,
      notifications: state.notifications
    };
    localStorage.setItem(`appState_${organizationId}`, JSON.stringify(stateToSave));
  } catch (error) {
    console.error('Error saving state:', error);
  }
};

const reducer = (state: AppState, action: Action): AppState => {
  let newState: AppState;

  switch (action.type) {
    case 'LOAD_ORGANIZATION_DATA':
      newState = {
        ...state,
        ...action.payload,
        // Reset current selections when switching organizations
        currentClient: null,
        currentGrill: null,
        currentLoan: null,
        currentTontineGroup: null
      };
      break;

    case 'SET_CLIENTS':
      newState = { ...state, clients: action.payload };
      break;

    case 'ADD_CLIENT':
      newState = { 
        ...state, 
        clients: [...state.clients, { 
          ...action.payload, 
          loans: [], 
          withdrawals: [], 
          transfers: [],
          deposits: [] 
        }] 
      };
      break;

    case 'UPDATE_CLIENT':
      newState = {
        ...state,
        clients: state.clients.map((client) =>
          client.id === action.payload.id ? action.payload : client
        ),
        currentClient: state.currentClient?.id === action.payload.id ? action.payload : state.currentClient,
      };
      break;

    case 'DELETE_CLIENT':
      newState = {
        ...state,
        clients: state.clients.filter((client) => client.id !== action.payload),
        currentClient: state.currentClient?.id === action.payload ? null : state.currentClient,
      };
      break;

    case 'SET_GRILLS':
      newState = { ...state, grills: action.payload };
      break;

    case 'ADD_GRILL':
      newState = { ...state, grills: [...state.grills, action.payload] };
      break;

    case 'UPDATE_GRILL':
      newState = {
        ...state,
        grills: state.grills.map((grill) =>
          grill.id === action.payload.id ? action.payload : grill
        ),
        currentGrill: state.currentGrill?.id === action.payload.id ? action.payload : state.currentGrill,
      };
      break;

    case 'DELETE_GRILL':
      newState = {
        ...state,
        grills: state.grills.filter((grill) => grill.id !== action.payload),
        currentGrill: state.currentGrill?.id === action.payload ? null : state.currentGrill,
      };
      break;

    case 'SET_CURRENT_CLIENT':
      newState = { ...state, currentClient: action.payload };
      break;

    case 'SET_CURRENT_GRILL':
      newState = { ...state, currentGrill: action.payload };
      break;

    case 'SET_CURRENT_LOAN':
      newState = { 
        ...state,
        currentLoan: action.payload.loan,
        currentClient: action.payload.clientId 
          ? state.clients.find(c => c.id === action.payload.clientId) || null
          : null
      };
      break;

    case 'UPDATE_PAYMENT': {
      const { clientId, day, paid } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            const updatedPayments = client.payments.map((payment) => {
              if (payment.day === day) {
                return {
                  ...payment,
                  paid,
                  paidDate: paid ? new Date().toISOString() : undefined,
                };
              }
              return payment;
            });
            return { ...client, payments: updatedPayments };
          }
          return client;
        }),
        currentClient:
          state.currentClient?.id === clientId
            ? {
                ...state.currentClient,
                payments: state.currentClient.payments.map((payment) => {
                  if (payment.day === day) {
                    return {
                      ...payment,
                      paid,
                      paidDate: paid ? new Date().toISOString() : undefined,
                    };
                  }
                  return payment;
                }),
              }
            : state.currentClient,
      };
      break;
    }

    case 'ADD_WITHDRAWAL': {
      const { clientId, withdrawal } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              withdrawals: [...(client.withdrawals || []), withdrawal],
            };
          }
          return client;
        }),
        currentClient:
          state.currentClient?.id === clientId
            ? {
                ...state.currentClient,
                withdrawals: [...(state.currentClient.withdrawals || []), withdrawal],
              }
            : state.currentClient,
      };
      break;
    }

    case 'ADD_DEPOSIT': {
      const { clientId, deposit } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              deposits: [...(client.deposits || []), deposit],
            };
          }
          return client;
        }),
        currentClient:
          state.currentClient?.id === clientId
            ? {
                ...state.currentClient,
                deposits: [...(state.currentClient.deposits || []), deposit],
              }
            : state.currentClient,
      };
      break;
    }

    case 'ADD_TRANSFER': {
      const transfer = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === transfer.fromClientId || client.id === transfer.toClientId) {
            return {
              ...client,
              transfers: [...(client.transfers || []), transfer],
            };
          }
          return client;
        }),
        currentClient:
          state.currentClient?.id === transfer.fromClientId || state.currentClient?.id === transfer.toClientId
            ? {
                ...state.currentClient!,
                transfers: [...(state.currentClient!.transfers || []), transfer],
              }
            : state.currentClient,
      };
      break;
    }

    case 'REVERSE_TRANSACTION': {
      const { clientId, transactionId, type, note } = action.payload;
      const reversalDate = new Date().toISOString();

      newState = {
        ...state,
        clients: state.clients.map(client => {
          if (client.id === clientId || (type === 'transfer' && client.transfers.some(t => 
            t.id === transactionId && (t.fromClientId === client.id || t.toClientId === client.id)
          ))) {
            return {
              ...client,
              withdrawals: type === 'withdrawal' 
                ? client.withdrawals.map(w => 
                    w.id === transactionId 
                      ? { ...w, reversed: true, reversalDate, reversalNote: note }
                      : w
                  )
                : client.withdrawals,
              deposits: type === 'deposit'
                ? client.deposits.map(d =>
                    d.id === transactionId
                      ? { ...d, reversed: true, reversalDate, reversalNote: note }
                      : d
                  )
                : client.deposits,
              transfers: type === 'transfer'
                ? client.transfers.map(t =>
                    t.id === transactionId
                      ? { ...t, reversed: true, reversalDate, reversalNote: note }
                      : t
                  )
                : client.transfers
            };
          }
          return client;
        }),
        currentClient: state.currentClient?.id === clientId
          ? {
              ...state.currentClient,
              withdrawals: type === 'withdrawal'
                ? state.currentClient.withdrawals.map(w =>
                    w.id === transactionId
                      ? { ...w, reversed: true, reversalDate, reversalNote: note }
                      : w
                  )
                : state.currentClient.withdrawals,
              deposits: type === 'deposit'
                ? state.currentClient.deposits.map(d =>
                    d.id === transactionId
                      ? { ...d, reversed: true, reversalDate, reversalNote: note }
                      : d
                  )
                : state.currentClient.deposits,
              transfers: type === 'transfer'
                ? state.currentClient.transfers.map(t =>
                    t.id === transactionId
                      ? { ...t, reversed: true, reversalDate, reversalNote: note }
                      : t
                  )
                : state.currentClient.transfers
            }
          : state.currentClient
      };
      break;
    }

    case 'ADD_LOAN': {
      const { clientId, loan } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              loans: [...(client.loans || []), loan],
            };
          }
          return client;
        }),
      };
      break;
    }

    case 'DELETE_LOAN': {
      const { clientId, loanId } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              loans: client.loans.filter((loan) => loan.id !== loanId),
            };
          }
          return client;
        }),
        currentLoan: state.currentLoan?.id === loanId ? null : state.currentLoan,
        currentClient: state.currentClient?.id === clientId
          ? {
              ...state.currentClient,
              loans: state.currentClient.loans.filter((loan) => loan.id !== loanId),
            }
          : state.currentClient,
      };
      break;
    }

    case 'UPDATE_LOAN_STATUS': {
      const { clientId, loanId, status } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              loans: (client.loans || []).map((loan) =>
                loan.id === loanId ? { ...loan, status } : loan
              ),
            };
          }
          return client;
        }),
        currentLoan: state.currentLoan?.id === loanId 
          ? { ...state.currentLoan, status }
          : state.currentLoan,
      };
      break;
    }

    case 'ADD_LOAN_PAYMENT': {
      const { clientId, loanId, payment } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            return {
              ...client,
              loans: (client.loans || []).map((loan) =>
                loan.id === loanId
                  ? { ...loan, payments: [...loan.payments, payment] }
                  : loan
              ),
            };
          }
          return client;
        }),
        currentLoan: state.currentLoan?.id === loanId
          ? { ...state.currentLoan, payments: [...state.currentLoan.payments, payment] }
          : state.currentLoan,
      };
      break;
    }

    case 'RENEW_CLIENT_GRILL': {
      const { clientId, startDate } = action.payload;
      newState = {
        ...state,
        clients: state.clients.map((client) => {
          if (client.id === clientId) {
            const grill = state.grills.find((g) => g.id === client.grillId);
            if (!grill) return client;

            const newPayments = generatePayments(grill);
            return { 
              ...client, 
              startDate, 
              payments: newPayments, 
              isActive: true,
              withdrawals: [],
              transfers: client.transfers || [],
              loans: client.loans || [],
              deposits: client.deposits || []
            };
          }
          return client;
        }),
        currentClient:
          state.currentClient?.id === clientId
            ? {
                ...state.currentClient,
                startDate,
                payments: generatePayments(
                  state.grills.find((g) => g.id === state.currentClient?.grillId) as Grill
                ),
                isActive: true,
                withdrawals: [],
                transfers: state.currentClient.transfers || [],
                loans: state.currentClient.loans || [],
                deposits: state.currentClient.deposits || []
              }
            : state.currentClient,
      };
      break;
    }

    case 'UPDATE_ADMIN_PROFILE':
      newState = {
        ...state,
        adminProfile: action.payload
      };
      break;

    case 'ADD_NOTIFICATION':
      newState = {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
      break;

    case 'MARK_NOTIFICATION_READ':
      newState = {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      };
      break;

    case 'CLEAR_ALL_NOTIFICATIONS':
      newState = {
        ...state,
        notifications: []
      };
      break;

    case 'ADD_TONTINE_GROUP':
      newState = {
        ...state,
        tontineGroups: [...state.tontineGroups, action.payload]
      };
      break;

    case 'UPDATE_TONTINE_GROUP':
      newState = {
        ...state,
        tontineGroups: state.tontineGroups.map(group =>
          group.id === action.payload.id ? action.payload : group
        ),
        currentTontineGroup: state.currentTontineGroup?.id === action.payload.id 
          ? action.payload 
          : state.currentTontineGroup
      };
      break;

    case 'DELETE_TONTINE_GROUP':
      newState = {
        ...state,
        tontineGroups: state.tontineGroups.filter(group => group.id !== action.payload),
        currentTontineGroup: state.currentTontineGroup?.id === action.payload 
          ? null 
          : state.currentTontineGroup
      };
      break;

    case 'SET_CURRENT_TONTINE_GROUP':
      newState = {
        ...state,
        currentTontineGroup: action.payload
      };
      break;

    case 'UPDATE_TONTINE_CONTRIBUTION': {
      const { groupId, memberId, contributionId, status } = action.payload;
      const updatedGroups = state.tontineGroups.map(group => {
        if (group.id === groupId) {
          const updatedMembers = group.members.map(member => {
            if (member.id === memberId) {
              const updatedContributions = member.contributions.map(contribution =>
                contribution.id === contributionId ? { ...contribution, status } : contribution
              );
              return { ...member, contributions: updatedContributions };
            }
            return member;
          });

          const periodNumber = updatedMembers
            .find(m => m.id === memberId)
            ?.contributions.find(c => c.id === contributionId)?.periodNumber;

          if (periodNumber) {
            const allPaidForPeriod = updatedMembers.every(member =>
              member.contributions.find(c => c.periodNumber === periodNumber)?.status === 'paid'
            );

            if (allPaidForPeriod) {
              const updatedMembersWithPayout = updatedMembers.map(member => {
                if (member.payoutOrder === periodNumber) {
                  return { ...member, hasPaidOut: true };
                }
                return member;
              });

              const allPaidOut = updatedMembersWithPayout.every(m => m.hasPaidOut);
              return {
                ...group,
                members: updatedMembersWithPayout,
                status: allPaidOut ? 'completed' : group.status
              };
            }
          }

          return { ...group, members: updatedMembers };
        }
        return group;
      });

      newState = {
        ...state,
        tontineGroups: updatedGroups,
        currentTontineGroup: state.currentTontineGroup?.id === groupId
          ? updatedGroups.find(g => g.id === groupId) || null
          : state.currentTontineGroup
      };
      break;
    }

    default:
      return state;
  }

  return newState;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { state: authState } = useAuth();
  const organizationId = authState.organization?.id || 'default';
  
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load organization data when organization changes
  useEffect(() => {
    if (organizationId && organizationId !== 'default') {
      const savedData = loadSavedState(organizationId);
      dispatch({ type: 'LOAD_ORGANIZATION_DATA', payload: savedData });
    }
  }, [organizationId]);

  // Save state when it changes
  useEffect(() => {
    if (organizationId && organizationId !== 'default') {
      saveState(state, organizationId);
    }
  }, [state, organizationId]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);