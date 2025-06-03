import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Download, Calendar, Filter, ArrowRightLeft } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Select from '../common/Select';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { generateTransactionReport } from './reportUtils';
import { 
  calculateTotalExpected, 
  calculateAmountPaid, 
  calculateBalanceRemaining,
  formatCurrency 
} from '../../utils/grillUtils';

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Reports: React.FC = () => {
  const { state } = useAppContext();
  const [dateRange, setDateRange] = useState('today');
  const [selectedClient, setSelectedClient] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfMonth(now),
          end: customEndDate ? new Date(customEndDate) : endOfMonth(now)
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
    }
  };

  const filteredClients = useMemo(() => {
    if (selectedClient === 'all') return state.clients;
    return state.clients.filter(client => client.id === selectedClient);
  }, [state.clients, selectedClient]);

  const dateRangeData = useMemo(() => {
    const { start, end } = getDateRange();
    return {
      payments: filteredClients.reduce((total, client) => {
        return total + client.payments.reduce((sum, payment) => {
          if (payment.paid && payment.paidDate) {
            const paymentDate = new Date(payment.paidDate);
            if (paymentDate >= start && paymentDate <= end) {
              return sum + payment.amount;
            }
          }
          return sum;
        }, 0);
      }, 0),
      deposits: filteredClients.reduce((total, client) => {
        return total + (client.deposits || []).reduce((sum, deposit) => {
          const depositDate = new Date(deposit.date);
          if (depositDate >= start && depositDate <= end) {
            return sum + deposit.amount;
          }
          return sum;
        }, 0);
      }, 0),
      withdrawals: filteredClients.reduce((total, client) => {
        return total + (client.withdrawals || []).reduce((sum, withdrawal) => {
          const withdrawalDate = new Date(withdrawal.date);
          if (withdrawalDate >= start && withdrawalDate <= end) {
            return sum + withdrawal.amount;
          }
          return sum;
        }, 0);
      }, 0),
      transfers: filteredClients.reduce((total, client) => {
        return total + (client.transfers || []).reduce((sum, transfer) => {
          const transferDate = new Date(transfer.date);
          if (transferDate >= start && transferDate <= end) {
            return sum + transfer.amount;
          }
          return sum;
        }, 0);
      }, 0),
      loans: filteredClients.reduce((total, client) => {
        return total + (client.loans || []).reduce((sum, loan) => {
          if (loan.status === 'approved') {
            const loanDate = new Date(loan.startDate);
            if (loanDate >= start && loanDate <= end) {
              return sum + loan.amount;
            }
          }
          return sum;
        }, 0);
      }, 0),
    };
  }, [filteredClients, dateRange, customStartDate, customEndDate]);

  const depositData = useMemo(() => {
    const { start, end } = getDateRange();
    const data = [];
    
    const depositsByDate = new Map();
    
    filteredClients.forEach(client => {
      (client.deposits || []).forEach(deposit => {
        const depositDate = new Date(deposit.date);
        if (depositDate >= start && depositDate <= end) {
          const date = format(depositDate, 'MMM d');
          const current = depositsByDate.get(date) || 0;
          depositsByDate.set(date, current + deposit.amount);
        }
      });
    });

    for (const [date, amount] of depositsByDate) {
      data.push({
        name: date,
        amount: amount
      });
    }

    return data.sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [filteredClients, dateRange, customStartDate, customEndDate]);

  const handleGenerateReport = (type: 'payments' | 'withdrawals' | 'loans' | 'transfers' | 'deposits') => {
    generateTransactionReport(filteredClients, state.grills, getDateRange(), type);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Filter</label>
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="all">All Clients</option>
              {state.clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-purple-600 mb-1">Deposits</h3>
                <p className="text-2xl font-bold text-purple-700">{formatCurrency(dateRangeData.deposits)}</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => handleGenerateReport('deposits')}
              >
                Export
              </Button>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-1">Payments</h3>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(dateRangeData.payments)}</p>
              </div>
              <Button
                variant="success"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => handleGenerateReport('payments')}
              >
                Export
              </Button>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-1">Withdrawals</h3>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(dateRangeData.withdrawals)}</p>
              </div>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => handleGenerateReport('withdrawals')}
              >
                Export
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-blue-600 mb-1">Transfers</h3>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(dateRangeData.transfers)}</p>
              </div>
              <Button
                variant="info"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => handleGenerateReport('transfers')}
              >
                Export
              </Button>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-medium text-yellow-600 mb-1">Loans</h3>
                <p className="text-2xl font-bold text-yellow-700">{formatCurrency(dateRangeData.loans)}</p>
              </div>
              <Button
                variant="warning"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={() => handleGenerateReport('loans')}
              >
                Export
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Deposit Trends">
          <div className="w-full h-[300px]">
            <LineChart
              width={500}
              height={300}
              data={depositData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8b5cf6" name="Deposit Amount" />
            </LineChart>
          </div>
        </Card>

        <Card title="Transaction Summary">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(dateRangeData.deposits + dateRangeData.payments + dateRangeData.withdrawals)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <Calendar size={20} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Net Cash Flow</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(dateRangeData.deposits + dateRangeData.payments - dateRangeData.withdrawals)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Filter size={20} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;