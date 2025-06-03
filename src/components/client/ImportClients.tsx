import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import Papa from 'papaparse';
import { generateId } from '../../utils/grillUtils';
import { Client } from '../../types';

const ImportClients: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [preview, setPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['Name', 'Email', 'Phone', 'Grill Plan ID', 'Start Date'];
    const csvContent = Papa.unparse({
      fields: headers,
      data: [
        ['John Doe', 'john@example.com', '+1234567890', '', '2024-03-20'],
        ['Jane Smith', 'jane@example.com', '+0987654321', '', '2024-03-20']
      ]
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'client-import-template.csv';
    link.click();
  };

  const validateRow = (row: any): string[] => {
    const errors: string[] = [];
    if (!row.Name) errors.push('Name is required');
    if (!row.Email) errors.push('Email is required');
    if (!row.Phone) errors.push('Phone is required');
    if (row['Grill Plan ID'] && !state.grills.find(g => g.id === row['Grill Plan ID'])) {
      errors.push('Invalid Grill Plan ID');
    }
    if (!row['Start Date'] || isNaN(new Date(row['Start Date']).getTime())) {
      errors.push('Invalid Start Date');
    }
    return errors;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const errors: { row: number; errors: string[] }[] = [];
        results.data.forEach((row: any, index: number) => {
          const rowErrors = validateRow(row);
          if (rowErrors.length > 0) {
            errors.push({ row: index + 1, errors: rowErrors });
          }
        });

        if (errors.length > 0) {
          setError(`Validation errors found:\n${errors.map(e => 
            `Row ${e.row}: ${e.errors.join(', ')}`
          ).join('\n')}`);
          setPreview([]);
        } else {
          setPreview(results.data);
          setError('');
        }
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`);
        setPreview([]);
      }
    });
  };

  const handleImport = () => {
    if (preview.length === 0) {
      setError('No valid data to import');
      return;
    }

    try {
      const newClients: Client[] = preview.map(row => {
        const grill = row['Grill Plan ID'] ? state.grills.find(g => g.id === row['Grill Plan ID']) : null;
        return {
          id: generateId(),
          name: row.Name,
          email: row.Email,
          phone: row.Phone,
          grillId: row['Grill Plan ID'] || undefined,
          startDate: new Date(row['Start Date']).toISOString(),
          payments: grill ? generatePayments(grill) : [],
          withdrawals: [],
          loans: [],
          transfers: [],
          deposits: [],
          isActive: true
        };
      });

      newClients.forEach(client => {
        dispatch({ type: 'ADD_CLIENT', payload: client });
      });

      setSuccess(`Successfully imported ${newClients.length} clients`);
      setPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError('Error importing clients. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <Card className="w-full max-w-4xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Import Clients</h2>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant="secondary"
              leftIcon={<Download size={18} />}
              onClick={downloadTemplate}
            >
              Download Template
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <Button
              variant="primary"
              leftIcon={<Upload size={18} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleImport}
                >
                  Import {preview.length} Clients
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Instructions:</h4>
            <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
              <li>File must be in CSV format</li>
              <li>First row must contain headers: Name, Email, Phone, Grill Plan ID, Start Date</li>
              <li>Start Date must be in YYYY-MM-DD format</li>
              <li>Grill Plan ID is optional</li>
              <li>Name, Email, Phone, and Start Date are required</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportClients;