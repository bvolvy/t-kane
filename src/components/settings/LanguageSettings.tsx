import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Globe, Check, AlertCircle } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';

const LanguageSettings: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [selectedLanguage, setSelectedLanguage] = useState(state.organizationSettings.language);
  const [selectedCurrency, setSelectedCurrency] = useState(state.organizationSettings.currency);
  const [selectedTimezone, setSelectedTimezone] = useState(state.organizationSettings.timezone);
  const [selectedDateFormat, setSelectedDateFormat] = useState(state.organizationSettings.dateFormat);
  const [success, setSuccess] = useState('');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'htg', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'HTG', name: 'Haitian Gourde', symbol: 'G' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
  ];

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Port-au-Prince', label: 'Haiti Time (HT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  ];

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US Format)', example: '12/31/2024' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (European Format)', example: '31/12/2024' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO Format)', example: '2024-12-31' },
  ];

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_ORGANIZATION_SETTINGS',
      payload: {
        language: selectedLanguage,
        currency: selectedCurrency,
        timezone: selectedTimezone,
        dateFormat: selectedDateFormat,
      }
    });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id: crypto.randomUUID(),
        title: 'Language & Regional Settings Updated',
        message: 'Your language and regional preferences have been saved successfully',
        type: 'success',
        date: new Date().toISOString(),
        read: false
      }
    });

    setSuccess('Settings saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const hasChanges = 
    selectedLanguage !== state.organizationSettings.language ||
    selectedCurrency !== state.organizationSettings.currency ||
    selectedTimezone !== state.organizationSettings.timezone ||
    selectedDateFormat !== state.organizationSettings.dateFormat;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Language & Regional Settings</h2>
        <p className="text-gray-600">
          Configure language, currency, and regional preferences for your organization
        </p>
      </div>

      <Card>
        <div className="space-y-8">
          {/* Language Selection */}
          <div>
            <div className="flex items-center mb-4">
              <Globe className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Display Language</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {languages.map((language) => (
                <div
                  key={language.code}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedLanguage === language.code
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLanguage(language.code as any)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{language.name}</p>
                      <p className="text-sm text-gray-500">{language.nativeName}</p>
                    </div>
                    {selectedLanguage === language.code && (
                      <Check className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Default Currency</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {currencies.map((currency) => (
                <div
                  key={currency.code}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCurrency === currency.code
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCurrency(currency.code as any)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {currency.symbol} {currency.code}
                      </p>
                      <p className="text-sm text-gray-500">{currency.name}</p>
                    </div>
                    {selectedCurrency === currency.code && (
                      <Check className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timezone Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Timezone</h3>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {timezones.map((timezone) => (
                <option key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Date Format</h3>
            <div className="space-y-3">
              {dateFormats.map((format) => (
                <div
                  key={format.value}
                  className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedDateFormat === format.value
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedDateFormat(format.value as any)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{format.label}</p>
                      <p className="text-sm text-gray-500">Example: {format.example}</p>
                    </div>
                    {selectedDateFormat === format.value && (
                      <Check className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {hasChanges && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
                <p className="text-sm text-blue-600">You have unsaved changes</p>
              </div>
              <Button variant="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}

          {!hasChanges && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSave} disabled>
                No Changes to Save
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900">Implementation Note</h4>
              <p className="text-sm text-yellow-800 mt-1">
                Language translations are currently being implemented. The interface will be updated 
                to reflect your selected language in future updates. Currency and date format changes 
                will take effect immediately throughout the application.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LanguageSettings;