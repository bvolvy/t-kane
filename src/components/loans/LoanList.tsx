import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Search, Eye, Ban, CheckCircle, Trash } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import LoanRequestForm from './LoanRequestForm';
import LoanDetails from './LoanDetails';
import { formatCurrency } from '../../utils/grillUtils';
import { format } from 'date-fns';

const LoanList: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get all loans from all clients
  const allLoans = state.clients.flatMap(client => 
    (client.loans || []).map(loan => ({
      ...loan,
      clientName: client.name,
      clientId: client.id
    }))
  );

  const filteredLoans = allLoans.filter(loan => 
    loan.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewLoan = (loan: any) => {
    dispatch({
      type: 'SET_CURRENT_LOAN',
      payload: {
        loan: {
          id: loan.id,
          amount: loan.amount,
          interestRate: loan.interestRate,
          startDate: loan.startDate,
          dueDate: loan.dueDate,
          status: loan.status,
          payments: loan.payments,
          note: loan.note
        },
        clientId: loan.clientId
      }
    });
  };

  const handleApproveLoan = (loan: any) => {
    if (window.confirm('Are you sure you want to approve this loan?')) {
      dispatch({
        type: 'UPDATE_LOAN_STATUS',
        payload: {
          clientId: loan.clientId,
          loanId: loan.id,
          status: 'approved'
        }
      });
    }
  };

  const handleRejectLoan = (loan: any) => {
    if (window.confirm('Are you sure you want to reject this loan?')) {
      dispatch({
        type: 'UPDATE_LOAN_STATUS',
        payload: {
          clientId: loan.clientId,
          loanId: loan.id,
          status: 'rejected'
        }
      });
    }
  };

  const handleDeleteLoan = (loan: any) => {
    if (loan.status === 'approved' && !window.confirm('This loan is approved. Are you sure you want to delete it?')) {
      return;
    }

    dispatch({
      type: 'DELETE_LOAN',
      payload: {
        clientId: loan.clientId,
        loanId: loan.id
      }
    });

    // Add notification
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Loan Deleted',
        message: `Loan for ${loan.clientName} has been deleted`,
        type: 'warning',
        date: new Date().toISOString(),
        read: false
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'paid': return 'text-blue-600 bg-blue-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const calculateTotalPaid = (payments: any[]) => {
    return payments.reduce((total, payment) => total + payment.amount, 0);
  };

  // Show loan details if a loan is selected
  if (state.currentLoan) {
    return <LoanDetails />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Loan Management</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <Button 
            variant="primary" 
            leftIcon={<Plus size={18} />}
            onClick={() => setShowRequestForm(true)}
          >
            Request Loan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Active Loans</h3>
          <p className="text-3xl font-bold">
            {allLoans.filter(loan => loan.status === 'approved').length}
          </p>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-600 to-green-700 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Amount Loaned</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              allLoans
                .filter(loan => loan.status === 'approved')
                .reduce((total, loan) => total + loan.amount, 0)
            )}
          </p>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
          <h3 className="text-lg font-semibold mb-2">Total Interest Collected</h3>
          <p className="text-3xl font-bold">
            {formatCurrency(
              allLoans
                .filter(loan => loan.status === 'approved')
                .reduce((total, loan) => 
                  total + loan.payments
                    .filter(payment => payment.type === 'interest')
                    .reduce((sum, payment) => sum + payment.amount, 0)
                , 0)
            )}
          </p>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interest Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No loans found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {loan.clientName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(loan.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {loan.interestRate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(loan.startDate), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(loan.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(calculateTotalPaid(loan.payments))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewLoan(loan)}
                          className="text-purple-600 hover:text-purple-900 cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        {loan.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveLoan(loan)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleRejectLoan(loan)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <Ban size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteLoan(loan)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showRequestForm && (
        <LoanRequestForm onClose={() => setShowRequestForm(false)} />
      )}
    </div>
  );
};

export default LoanList;