import React from 'react';
import { FaDollarSign } from 'react-icons/fa';

export type Currency = 'USD' | 'BDT';

interface CurrencySwitcherProps {
  currentCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  currentCurrency,
  onCurrencyChange
}) => {
  return (
    <div className="flex items-center gap-2 bg-white border rounded-lg shadow-sm p-1">
      <FaDollarSign className="w-4 h-4 text-gray-500 ml-2" />
      
      <button
        onClick={() => onCurrencyChange('USD')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          currentCurrency === 'USD'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
        }`}
      >
        USD
      </button>
      
      <div className="w-px h-4 bg-gray-300"></div>
      
      <button
        onClick={() => onCurrencyChange('BDT')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
          currentCurrency === 'BDT'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
        }`}
      >
        BDT
      </button>
    </div>
  );
};

export default CurrencySwitcher; 