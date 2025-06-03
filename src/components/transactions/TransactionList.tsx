import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { DollarSign, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar, Search, RotateCcw } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/grillUtils';
import { format } from 'date-fns';

const TransactionList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [reversalNote, setReversalNote] = useState('');
  const [showReversalModal, setShowReversalModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<{
    id: string;
    type: 'withdrawal' | 'deposit' | 'transfer';
    clientId: string;
  } | null>(null);

  // Calculate totals
  const totals = state.clients.reduce((acc, client) => {
    // Calculate deposits
    const depositTotal = (client.deposits || [])
      .filter(deposit => !deposit.reversed)
      .reduce((sum, deposit) => sum + deposit.amount, 0);
    
    // Calculate withdrawals
    const withdrawalTotal = (client.withdrawals || [])
      .filter(withdrawal => !withdrawal.reversed)
      .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    
    // Calculate transfers (absolute sum of all transfers)
    const transferTotal = (client.transfers || [])
      .filter(transfer => !transfer.reversed)
      .reduce((sum, transfer) => sum + transfer.amount, 0);

    return {
      deposits: acc.deposits + depositTotal,
      withdrawals: acc.withdrawals + withdrawalTotal,
      transfers: acc.transfers + transferTotal
    };
  }, { deposits: 0, withdrawals: 0, transfers: 0 });

  // Get all transactions
  const allTransactions = state.clients.flatMap(client => {
    const deposits = (client.deposits || []).map(deposit => ({
      ...deposit,
      type: 'deposit' as const,
      clientName: client.name
    }));

    const withdrawals = (client.withdrawals || []).map(withdrawal => ({
      ...withdrawal,
      type: 'withdrawal' as const,
      clientName: client.name
    }));

    const transfers = (client.transfers || []).map(transfer => ({
      ...transfer,
      type: 'transfer' as const,
      fromClient: state.clients.find(c => c.id === transfer.fromClientId)?.name || 'Unknown',
      toClient: state.clients.find(c => c.id === transfer.toClientId)?.name || 'Unknown'
    }));

    return [...deposits, ...withdrawals, ...transfers];
  });

  // Sort transactions by date (most recent first)
  const sortedTransactions = allTransactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter(transaction => {
      if ('clientName' in transaction) {
        return transaction.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      }
      if ('fromClient' in transaction) {
        return transaction.fromClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
               transaction.toClient.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });

  const handleReverseTransaction = () => {
    if (!selectedTransaction || !reversalNote.trim()) return;

    dispatch({
      type: 'REVERSE_TRANSACTION',
      payload: {
        clientId: selectedTransaction.clientId,
        transactionId: selectedTransaction.id,
        type: selectedTransaction.type,
        note: reversalNote.trim()
      }
    });

    // Add notification
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Transaction Reversed',
        message: `A ${selectedTransaction.type} transaction has been reversed`,
        type: 'warning',
        date: new Date().toISOString(),
        read: false
      }
    });

    setShowReversalModal(false);
    setSelectedTransaction(null);
    setReversalNote('');
  };

  const openReversalModal = (transaction: any) => {
    let type: 'withdrawal' | 'deposit' | 'transfer';
    let clientId: string;

    if ('clientName' in transaction) {
      type = transaction.type as 'withdrawal' | 'deposit';
      clientId = state.clients.find(c => c.name === transaction.clientName)?.id || '';
    } else {
      type = 'transfer';
      clientId = state.clients.find(c => c.name === transaction.fromClient)?.id || '';
    }

    setSelectedTransaction({
      id: transaction.id,
      type,
      clientId
    });
    setShowReversalModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500 bg-opacity-30 rounded-lg">
              <ArrowDownRight className="h-6 w-6" />
            </div>
            <span className="text-purple-200">Total</span>
          </div>
          <p className="text-3xl font-bold mb-1">{formatCurrency(totals.deposits)}</p>
          <p className="text-purple-200">Deposits</p>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-red-500 bg-opacity-30 rounded-lg">
              <ArrowUpRight className="h-6 w-6" />
            </div>
            <span className="text-red-200">Total</span>
          </div>
          <p className="text-3xl font-bold mb-1">{formatCurrency(totals.withdrawals)}</p>
          <p className="text-red-200">Withdrawals</p>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-yellow-500 bg-opacity-30 rounded-lg">
              <ArrowRightLeft className="h-6 w-6" />
            </div>
            <span className="text-yellow-100">Total</span>
          </div>
          <p className="text-3xl font-bold mb-1">{formatCurrency(totals.transfers)}</p>
          <p className="text-yellow-100">Transfers</p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTransactions.map((transaction) => (
                <tr key={transaction.id} className={transaction.reversed ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(transaction.date), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'deposit' 
                        ? 'bg-purple-100 text-purple-800'
                        : transaction.type === 'withdrawal'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {'clientName' in transaction ? (
                      transaction.clientName
                    ) : (
                      <span>
                        {transaction.fromClient} → {transaction.toClient}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={
                      transaction.type === 'deposit' 
                        ? 'text-purple-600'
                        : transaction.type === 'withdrawal'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.reversed ? (
                      <div>
                        <p className="line-through">{transaction.note || '-'}</p>
                        <p className="text-red-600">{transaction.reversalNote}</p>
                      </div>
                    ) : (
                      transaction.note || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.reversed ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Reversed
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!transaction.reversed && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RotateCcw size={16} />}
                        onClick={() => openReversalModal(transaction)}
                      >
                        Reverse
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showReversalModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reverse Transaction
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reversal Note (Required)
              </label>
              <textarea
                value={reversalNote}
                onChange={(e) => setReversalNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                rows={3}
                placeholder="Enter reason for reversal"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowReversalModal(false);
                  setSelectedTransaction(null);
                  setReversalNote('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleReverseTransaction}
                disabled={!reversalNote.trim()}
              >
                Confirm Reversal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;