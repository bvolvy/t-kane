import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Plus, Calendar, DollarSign } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import { formatCurrency, calculateLoanPaymentSummary } from '../../utils/grillUtils';
import { format } from 'date-fns';
import LoanPaymentForm from './LoanPaymentForm';

const LoanDetails: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { currentLoan, currentClient } = state;

  if (!currentLoan || !currentClient) return null;

  const handleBack = () => {
    dispatch({ 
      type: 'SET_CURRENT_LOAN', 
      payload: { loan: null, clientId: null } 
    });
  };

  const {
    principalPaid,
    interestPaid,
    remainingPrincipal,
    remainingInterest,
    totalPaid,
    totalAmount,
    remainingTotal,
    totalInterestExpected,
    progress
  } = calculateLoanPaymentSummary(currentLoan);

  return (
    <>
      <div className="mb-6 flex justify-between items-center">
        <Button 
          variant="secondary" 
          leftIcon={<ArrowLeft size={18} />} 
          onClick={handleBack}
        >
          Back to Loans
        </Button>
        {currentLoan.status === 'approved' && remainingTotal > 0 && (
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setShowPaymentForm(true)}
          >
            Make Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Loan Details</h2>
              <p className="text-gray-500">Client: {currentClient.name}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              currentLoan.status === 'approved' ? 'bg-green-100 text-green-800' :
              currentLoan.status === 'rejected' ? 'bg-red-100 text-red-800' :
              currentLoan.status === 'paid' ? 'bg-blue-100 text-blue-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {currentLoan.status.charAt(0).toUpperCase() + currentLoan.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Principal Amount</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(currentLoan.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount (with Interest)</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Interest Rate</p>
              <p className="text-xl font-bold text-gray-900">{currentLoan.interestRate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Interest</p>
              <p className="text-xl font-bold text-purple-600">{formatCurrency(totalInterestExpected)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-gray-900">{format(new Date(currentLoan.startDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-gray-900">{format(new Date(currentLoan.dueDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>

          {currentLoan.note && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Note</p>
              <p className="text-gray-700">{currentLoan.note}</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-gray-800 mb-4">Payment Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Total Paid</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-gray-500">of {formatCurrency(totalAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <DollarSign size={20} />
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Principal Paid</p>
                <p className="text-lg font-semibold text-blue-600">{formatCurrency(principalPaid)}</p>
                <p className="text-xs text-gray-500">Remaining: {formatCurrency(remainingPrincipal)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <DollarSign size={20} />
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Interest Paid</p>
                <p className="text-lg font-semibold text-purple-600">{formatCurrency(interestPaid)}</p>
                <p className="text-xs text-gray-500">Remaining: {formatCurrency(remainingInterest)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <DollarSign size={20} />
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-purple-600"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(progress)}% Complete
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Payment History">
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
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLoan.payments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No payments recorded
                  </td>
                </tr>
              ) : (
                currentLoan.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(payment.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.type === 'principal' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showPaymentForm && (
        <LoanPaymentForm
          loan={currentLoan}
          clientId={currentClient.id}
          remainingPrincipal={remainingPrincipal}
          remainingInterest={remainingInterest}
          onClose={() => setShowPaymentForm(false)}
        />
      )}
    </>
  );
};

export default LoanDetails;