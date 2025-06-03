import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, isWithinInterval } from 'date-fns';
import { Client, Grill, Withdrawal, Loan, Transfer } from '../../types';
import { 
  calculateTotalExpected, 
  calculateAmountPaid, 
  calculateBalanceRemaining,
  formatCurrency 
} from '../../utils/grillUtils';

export const generateTransactionReport = (
  clients: Client[],
  grills: Grill[],
  dateRange: { start: Date; end: Date },
  type: 'payments' | 'withdrawals' | 'loans' | 'transfers'
) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'MMMM dd, yyyy');
  const dateRangeText = `${format(dateRange.start, 'MMM dd, yyyy')} - ${format(dateRange.end, 'MMM dd, yyyy')}`;
  
  // Add title
  doc.setFontSize(20);
  doc.text(`T-Kanè ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 15, 20);
  
  // Add report info
  doc.setFontSize(12);
  doc.text(`Generated on: ${today}`, 15, 30);
  doc.text(`Date Range: ${dateRangeText}`, 15, 40);

  let tableData: any[] = [];
  let total = 0;

  if (type === 'transfers') {
    clients.forEach(client => {
      const filteredTransfers = (client.transfers || [])
        .filter(transfer => {
          const transferDate = new Date(transfer.date);
          return isWithinInterval(transferDate, dateRange);
        });

      filteredTransfers.forEach(transfer => {
        const fromClient = clients.find(c => c.id === transfer.fromClientId)?.name || 'Unknown';
        const toClient = clients.find(c => c.id === transfer.toClientId)?.name || 'Unknown';
        
        tableData.push([
          format(new Date(transfer.date), 'MMM dd, yyyy HH:mm'),
          fromClient,
          toClient,
          formatCurrency(transfer.amount),
          transfer.note || '-'
        ]);
        total += transfer.amount;
      });
    });

    autoTable(doc, {
      head: [['Date', 'From', 'To', 'Amount', 'Note']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] },
    });
  } else if (type === 'payments') {
    clients.forEach(client => {
      const grill = grills.find(g => g.id === client.grillId);
      const filteredPayments = client.payments.filter(payment => {
        if (!payment.paid || !payment.paidDate) return false;
        const paymentDate = new Date(payment.paidDate);
        return isWithinInterval(paymentDate, dateRange);
      });

      filteredPayments.forEach(payment => {
        tableData.push([
          client.name,
          grill?.name || 'Unknown Plan',
          format(new Date(payment.paidDate!), 'MMM dd, yyyy'),
          formatCurrency(payment.amount),
          `Day ${payment.day}`
        ]);
        total += payment.amount;
      });
    });

    autoTable(doc, {
      head: [['Client Name', 'Plan', 'Date', 'Amount', 'Day']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] },
    });
  } else if (type === 'withdrawals') {
    clients.forEach(client => {
      const filteredWithdrawals = (client.withdrawals || []).filter(withdrawal => {
        const withdrawalDate = new Date(withdrawal.date);
        return isWithinInterval(withdrawalDate, dateRange);
      });

      filteredWithdrawals.forEach(withdrawal => {
        tableData.push([
          client.name,
          format(new Date(withdrawal.date), 'MMM dd, yyyy'),
          formatCurrency(withdrawal.amount),
          withdrawal.note || '-'
        ]);
        total += withdrawal.amount;
      });
    });

    autoTable(doc, {
      head: [['Client Name', 'Date', 'Amount', 'Note']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] },
    });
  } else if (type === 'loans') {
    clients.forEach(client => {
      const filteredLoans = (client.loans || []).filter(loan => {
        const loanDate = new Date(loan.startDate);
        return isWithinInterval(loanDate, dateRange);
      });

      filteredLoans.forEach(loan => {
        const totalPaid = loan.payments.reduce((sum, payment) => sum + payment.amount, 0);
        tableData.push([
          client.name,
          format(new Date(loan.startDate), 'MMM dd, yyyy'),
          formatCurrency(loan.amount),
          `${loan.interestRate}%`,
          loan.status,
          formatCurrency(totalPaid)
        ]);
        total += loan.amount;
      });
    });

    autoTable(doc, {
      head: [['Client Name', 'Date', 'Amount', 'Interest Rate', 'Status', 'Amount Paid']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [139, 92, 246] },
    });
  }

  // Add summary
  const finalY = (doc as any).lastAutoTable.finalY || 50;
  doc.text(`Total ${type}: ${formatCurrency(total)}`, 15, finalY + 10);
  doc.text(`Total Records: ${tableData.length}`, 15, finalY + 20);

  // Save the PDF
  doc.save(`tkane-${type}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateClientPaymentReport = (client: Client, grill: Grill) => {
  const doc = new jsPDF();
  const today = format(new Date(), 'MMMM dd, yyyy');
  const startDate = format(new Date(client.startDate), 'MMMM dd, yyyy');
  
  // Add title and client info
  doc.setFontSize(20);
  doc.text('T-Kanè Client Payment Schedule', 15, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated on: ${today}`, 15, 35);
  doc.text('Client Information:', 15, 50);
  doc.text(`Name: ${client.name}`, 25, 60);
  doc.text(`Email: ${client.email}`, 25, 70);
  doc.text(`Phone: ${client.phone}`, 25, 80);
  doc.text(`Plan: ${grill.name} ($${grill.baseAmount}/day)`, 25, 90);
  doc.text(`Start Date: ${startDate}`, 25, 100);

  // Add payment summary
  const totalExpected = calculateTotalExpected(client, [grill]);
  const amountPaid = calculateAmountPaid(client.payments);
  const balance = calculateBalanceRemaining(client, [grill]);
  
  doc.text('Payment Summary:', 15, 120);
  doc.text(`Total Expected: ${formatCurrency(totalExpected)}`, 25, 130);
  doc.text(`Amount Paid: ${formatCurrency(amountPaid)}`, 25, 140);
  doc.text(`Balance Remaining: ${formatCurrency(balance)}`, 25, 150);
  doc.text(`Progress: ${Math.round((amountPaid / totalExpected) * 100)}%`, 25, 160);

  // Create payment schedule table
  const tableData = client.payments.map(payment => {
    const paidDate = payment.paidDate ? format(new Date(payment.paidDate), 'MM/dd/yyyy') : '-';
    return [
      payment.day,
      formatCurrency(payment.amount),
      payment.paid ? 'Paid' : 'Unpaid',
      paidDate
    ];
  });

  autoTable(doc, {
    head: [['Day', 'Amount', 'Status', 'Payment Date']],
    body: tableData,
    startY: 180,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] },
  });

  // Save the PDF
  doc.save(`tkane-client-report-${client.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};