import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
  ArrowLeft, Edit, Calendar, RefreshCw, CheckCircle, XCircle, Download, Wallet, SendHorizontal, CreditCard, DollarSign
} from 'lucide-react';
import Button from '../common/Button';
import ClientForm from './ClientForm';
import WithdrawalForm from './WithdrawalForm';
import TransferForm from './TransferForm';
import DepositForm from './DepositForm';
import Card from '../common/Card';
import { 
  calculateTotalExpected, 
  calculateAmountPaid, 
  calculateBalanceRemaining,
  calculateAvailableBalance,
  formatCurrency,
  isPlanCompleted,
  calculateTotalTransfers
} from '../../utils/grillUtils';
import { generateClientPaymentReport } from '../reports/reportUtils';

const ClientDetails: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const { currentClient } = state;

  if (!currentClient) {
    return null;
  }

  const grill = currentClient.grillId ? state.grills.find((g) => g.id === currentClient.grillId) : null;
  const totalExpected = calculateTotalExpected(currentClient, state.grills);
  const amountPaid = calculateAmountPaid(currentClient.payments);
  const balanceRemaining = calculateBalanceRemaining(currentClient, state.grills);
  const availableBalance = calculateAvailableBalance(currentClient, state.grills);
  const totalTransfers = calculateTotalTransfers(currentClient.transfers, currentClient.id);
  const progress = totalExpected > 0 ? (amountPaid / totalExpected) * 100 : 0;
  const isCompleted = isPlanCompleted(currentClient);

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_CLIENT', payload: null });
  };

  const handlePaymentToggle = (day: number, paid: boolean) => {
    const payment = currentClient.payments.find(p => p.day === day);
    if (!paid && payment?.paid && !window.confirm('Are you sure you want to mark this payment as unpaid?')) {
      return;
    }
    dispatch({
      type: 'UPDATE_PAYMENT',
      payload: { clientId: currentClient.id, day, paid },
    });
  };

  const handleRenewPlan = () => {
    if (!grill) {
      alert('Please assign a grill plan to this client first');
      return;
    }
    
    if (window.confirm('Are you sure you want to renew this client\'s plan?')) {
      dispatch({
        type: 'RENEW_CLIENT_GRILL',
        payload: { clientId: currentClient.id, startDate: new Date().toISOString() },
      });
    }
  };

  const handleGenerateReport = () => {
    if (!grill) {
      alert('Cannot generate report: No grill plan assigned');
      return;
    }
    generateClientPaymentReport(currentClient, grill);
  };

  const startDate = new Date(currentClient.startDate);

  const paymentRows = [];
  for (let i = 0; i < currentClient.payments.length; i += 10) {
    paymentRows.push(currentClient.payments.slice(i, i + 10));
  }

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="secondary" 
          leftIcon={<ArrowLeft size={18} />} 
          onClick={handleBack}
        >
          Back to Clients
        </Button>
        <div className="flex gap-3">
          {grill && (
            <Button 
              variant="primary" 
              leftIcon={<Download size={18} />}
              onClick={handleGenerateReport}
            >
              Generate Report
            </Button>
          )}
          <Button 
            variant="primary" 
            leftIcon={<Edit size={18} />}
            onClick={() => setShowEditForm(true)}
          >
            Edit Client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{currentClient.name}</h2>
            <div className="flex items-center">
              <Calendar size={18} className="text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">
                Started: {startDate.toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-500 text-sm">Email</p>
              <p className="font-medium">{currentClient.email}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Phone</p>
              <p className="font-medium">{currentClient.phone}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Grill Plan</p>
              <p className="font-medium">{grill ? `${grill.name} ($${grill.baseAmount}/day)` : 'No plan assigned'}</p>
            </div>
            {grill && (
              <div>
                <p className="text-gray-500 text-sm">Status</p>
                <p className={`font-medium ${isCompleted ? 'text-green-600' : 'text-purple-600'}`}>
                  {isCompleted ? 'Completed' : 'Active'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500 bg-opacity-30 rounded-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <span className="text-blue-100 text-sm">Available Balance</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              {formatCurrency(availableBalance)}
            </h3>
            <div className="flex gap-2">
              {availableBalance > 0 && (
                <>
                  <Button 
                    variant="danger" 
                    leftIcon={<Wallet size={18} />}
                    onClick={() => setShowWithdrawalForm(true)}
                  >
                    Withdraw
                  </Button>
                  <Button 
                    variant="warning" 
                    leftIcon={<SendHorizontal size={18} />}
                    onClick={() => setShowTransferForm(true)}
                  >
                    Transfer
                  </Button>
                </>
              )}
              <Button 
                variant="primary" 
                leftIcon={<DollarSign size={18} />}
                onClick={() => setShowDepositForm(true)}
              >
                Deposit
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-lg mb-4">Payment Summary</h3>
          <div className="space-y-4">
            {grill ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Total Expected</p>
                  <p className="text-xl font-bold">{formatCurrency(totalExpected)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(amountPaid)}</p>
                </div>
              </>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                <p>No grill plan assigned</p>
                <p className="text-sm mt-1">Edit client to assign a plan</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Net Transfers</p>
              <p className={`text-xl font-bold ${totalTransfers >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totalTransfers)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Available Balance</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(availableBalance)}</p>
            </div>
            {grill && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Balance Remaining</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(balanceRemaining)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Progress</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        progress >= 100
                          ? 'bg-green-600'
                          : progress > 50
                          ? 'bg-blue-600'
                          : 'bg-purple-600'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-1 block">
                    {Math.round(progress)}% Complete
                  </span>
                </div>
                <div className="flex gap-2">
                  {isCompleted && (
                    <Button 
                      variant="success" 
                      isFullWidth 
                      leftIcon={<RefreshCw size={18} />}
                      onClick={handleRenewPlan}
                    >
                      Renew Plan
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {currentClient.deposits && currentClient.deposits.length > 0 && (
        <Card title="Deposit History" className="mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentClient.deposits.map((deposit) => (
                  <tr key={deposit.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(deposit.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      +{formatCurrency(deposit.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deposit.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentClient.transfers && currentClient.transfers.length > 0 && (
        <Card title="Transfer History" className="mb-6">
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
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentClient.transfers.map((transfer) => {
                  const isOutgoing = transfer.fromClientId === currentClient.id;
                  const otherClient = state.clients.find(c => 
                    isOutgoing ? c.id === transfer.toClientId : c.id === transfer.fromClientId
                  );

                  return (
                    <tr key={transfer.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transfer.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isOutgoing 
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isOutgoing ? 'Sent' : 'Received'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {otherClient?.name || 'Unknown Client'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(transfer.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transfer.note || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentClient.withdrawals && currentClient.withdrawals.length > 0 && (
        <Card title="Withdrawal History" className="mb-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentClient.withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(withdrawal.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      -{formatCurrency(withdrawal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {withdrawal.note || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {grill && currentClient.payments.length > 0 && (
        <Card title="Payment Schedule">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {paymentRows.map((row, rowIndex) => (
                <div key={rowIndex} className="mb-4 grid grid-cols-10 gap-2">
                  {row.map((payment) => {
                    const dayNumber = payment.day;
                    const amount = payment.amount;
                    const isPaid = payment.paid;
                    const paidDate = payment.paidDate ? new Date(payment.paidDate) : null;
                    
                    return (
                      <div 
                        key={dayNumber}
                        className={`border rounded-md p-3 cursor-pointer transition-all ${
                          isPaid 
                            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handlePaymentToggle(dayNumber, !isPaid)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold bg-gray-100 px-1.5 py-0.5 rounded">
                            Day {dayNumber}
                          </span>
                          {isPaid ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-gray-300" />
                          )}
                        </div>
                        <p className={`text-lg font-bold ${isPaid ? 'text-green-600' : 'text-gray-700'}`}>
                          ${amount}
                        </p>
                        <div className="text-xs">
                          <p className={isPaid ? 'text-green-600' : 'text-gray-500'}>
                            {isPaid ? 'Paid' : 'Unpaid'}
                          </p>
                          {paidDate && (
                            <p className="text-gray-500 mt-1">
                              {paidDate.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {showEditForm && (
        <ClientForm
          client={currentClient}
          onClose={() => setShowEditForm(false)}
        />
      )}

      {showWithdrawalForm && (
        <WithdrawalForm
          clientId={currentClient.id}
          availableBalance={availableBalance}
          onClose={() => setShowWithdrawalForm(false)}
        />
      )}

      {showTransferForm && (
        <TransferForm
          fromClientId={currentClient.id}
          availableBalance={availableBalance}
          onClose={() => setShowTransferForm(false)}
        />
      )}

      {showDepositForm && (
        <DepositForm
          clientId={currentClient.id}
          onClose={() => setShowDepositForm(false)}
        />
      )}
    </>
  );
};

export default ClientDetails;