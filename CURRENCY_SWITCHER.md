# Currency Switcher Feature

## Overview
The currency switcher allows users to toggle between USD (US Dollar) and BDT (Bangladeshi Taka) for viewing financial data in the Finances page.

## Features

### 1. Currency Toggle
- Switch between USD and BDT currencies
- Real-time conversion of all displayed amounts
- Visual indicator of current exchange rate

### 2. Exchange Rate
- **Current Rate**: 1 USD = 120 BDT
- Rate is displayed when BDT is selected
- Based on recent market data (July 2024)

### 3. Automatic Conversion
- **Display**: All amounts are converted from USD (base currency) to selected currency
- **Input**: When creating transactions in BDT, amounts are converted to USD for storage
- **Formatting**: Proper currency symbols and number formatting for each currency

## Implementation Details

### Components Created
1. **CurrencySwitcher.tsx** - Toggle component with USD/BDT buttons
2. **currency.ts** - Utility functions for conversion and formatting

### Key Functions
- `convertCurrency()` - Convert amounts between currencies
- `formatCurrency()` - Format amounts with proper symbols
- `convertAndFormatCurrency()` - Combined conversion and formatting

### Integration
- Added to Finances page header
- Applied to all financial summary cards
- Integrated with transaction creation
- Added to transaction table display

## Currency Formatting

### USD
- Symbol: $
- Format: $1,234.56
- Locale: en-US

### BDT
- Symbol: ৳
- Format: ৳১,২৩৪.৫৬
- Locale: bn-BD (Bengali formatting)

## Usage

1. **Viewing Data**: Click USD/BDT toggle to switch currency display
2. **Creating Transactions**: Enter amounts in selected currency (automatically converted to USD for storage)
3. **Exchange Rate**: Rate indicator shows when BDT is selected

## Future Enhancements

1. **Live Exchange Rates**: Integration with currency API for real-time rates
2. **More Currencies**: Support for additional currencies (EUR, GBP, etc.)
3. **Rate History**: Display historical exchange rate data
4. **User Preferences**: Save preferred currency setting per user 