import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import axios from 'axios';

const ThemeContext = createContext();

const CURRENCIES = {
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', rate: 1 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 0.30 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.0036 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.0033 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', rate: 0.013 }
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    siteName: 'OnePlay1',
    siteTagline: 'Your Ultimate Aviator Crash Game',
    siteLogo: '',
    favicon: '',
    themeColors: {
      background: '#0d070b',
      headerBg: 'rgba(22, 9, 15, 0.95)',
      primary: '#e02424',
      secondary: 'rgba(224, 36, 36, 0.15)',
      betButton: '#10b981',
      cashoutButton: '#ef4444',
      depositButton: '#10b981',
      withdrawButton: '#ef4444',
      cardBg: 'rgba(30, 15, 22, 0.7)',
      text: '#ffffff'
    },
    depositMethods: {
      easypaisa: { enabled: true, accountNumber: '03001234567', accountTitle: 'OnePlay1 Official', qrCode: '', instructions: 'Send money to EasyPaisa and enter Transaction ID' },
      jazzcash: { enabled: true, accountNumber: '03019876543', accountTitle: 'OnePlay1 Official', qrCode: '', instructions: 'Send money to JazzCash and enter Transaction ID' },
      bank: { enabled: true, bankName: 'Meezan Bank', accountNumber: '01020304050607', accountTitle: 'OnePlay1 Official', qrCode: '', instructions: 'Transfer to bank and upload receipt screenshot' }
    },
    minDeposit: 100,
    maxDeposit: 100000,
    minWithdraw: 200,
    maxWithdraw: 50000
  });

  const [selectedCurrency, setSelectedCurrency] = useState(
    localStorage.getItem('oneplay1_currency') || 'PKR'
  );
  const [exchangeRates, setExchangeRates] = useState({
    PKR: 1,
    INR: 0.30,
    USD: 0.0036,
    EUR: 0.0033,
    AED: 0.013
  });

  // Apply theme CSS variables
  const applyTheme = useCallback((themeColors) => {
    if (!themeColors) return;
    const root = document.documentElement;
    if (themeColors.background) root.style.setProperty('--theme-bg', themeColors.background);
    if (themeColors.headerBg) root.style.setProperty('--header-bg', themeColors.headerBg);
    if (themeColors.primary) root.style.setProperty('--primary', themeColors.primary);
    if (themeColors.secondary) root.style.setProperty('--secondary', themeColors.secondary);
    if (themeColors.betButton) root.style.setProperty('--bet-btn', themeColors.betButton);
    if (themeColors.cashoutButton) root.style.setProperty('--cashout-btn', themeColors.cashoutButton);
    if (themeColors.depositButton) root.style.setProperty('--deposit-btn', themeColors.depositButton);
    if (themeColors.withdrawButton) root.style.setProperty('--withdraw-btn', themeColors.withdrawButton);
    if (themeColors.cardBg) root.style.setProperty('--card-bg', themeColors.cardBg);
    if (themeColors.text) root.style.setProperty('--text-color', themeColors.text);
  }, []);

  const refreshSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setSettings(res.data);
        if (res.data.themeColors) {
          applyTheme(res.data.themeColors);
        }
        if (res.data.siteName) {
          document.title = `${res.data.siteName} — Aviator Crash Game`;
        }
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
  };

  // Fetch exchange rates
  const fetchRates = async () => {
    try {
      const res = await axios.get('https://open.er-api.com/v6/latest/PKR', { timeout: 3000 });
      if (res.data?.rates) {
        setExchangeRates({
          PKR: 1,
          INR: res.data.rates.INR || 0.30,
          USD: res.data.rates.USD || 0.0036,
          EUR: res.data.rates.EUR || 0.0033,
          AED: res.data.rates.AED || 0.013
        });
      }
    } catch (e) {
      // Fallback to offline pre-configured rates
      console.log('Using fallback exchange rates');
    }
  };

  useEffect(() => {
    refreshSettings();
    fetchRates();
  }, []);

  const changeCurrency = (code) => {
    setSelectedCurrency(code);
    localStorage.setItem('oneplay1_currency', code);
  };

  // Convert PKR amount to selected currency with symbol
  const formatAmount = (pkrAmount, showSymbol = true) => {
    if (pkrAmount === null || pkrAmount === undefined || isNaN(pkrAmount)) {
      pkrAmount = 0;
    }
    const rate = exchangeRates[selectedCurrency] || 1;
    const converted = pkrAmount * rate;
    const curr = CURRENCIES[selectedCurrency] || CURRENCIES.PKR;

    let formattedNumber;
    if (selectedCurrency === 'USD' || selectedCurrency === 'EUR') {
      formattedNumber = converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      formattedNumber = converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    return showSymbol ? `${curr.symbol} ${formattedNumber}` : formattedNumber;
  };

  return (
    <ThemeContext.Provider
      value={{
        settings,
        refreshSettings,
        selectedCurrency,
        changeCurrency,
        formatAmount,
        currencies: CURRENCIES,
        applyTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
