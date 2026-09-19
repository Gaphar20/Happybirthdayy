/**
 * DIRECT GIFT ACCOUNTS CONFIGURATION (OPay & EcoBank)
 *
 * Direct bank transfer and QR code configuration for Dad's birthday gifts.
 * No payment gateway or API keys are required — transfers are sent
 * directly from the visitor's banking app to Dad's account.
 */

export interface GiftAccountConfig {
  bankName: 'OPay' | 'EcoBank' | string;
  displayName: string;
  tagline: string;
  accountName: string;
  accountNumber: string;
  qrCodeUrl?: string;
  brandColor: string;
  accentBg: string;
  badgeText: string;
}

export const DIRECT_GIFT_ACCOUNTS: Record<'opay' | 'ecobank', GiftAccountConfig> = {
  // 1. OPAY ACCOUNT CONFIGURATION
  opay: {
    bankName: 'OPay',
    displayName: 'OPay',
    tagline: 'Instant Zero-Fee Mobile Transfer',
    accountName: 'Abdul razaq Oluwatoyin Idris',
    accountNumber: '8028268695',
    qrCodeUrl: '/opay-qr.png',
    brandColor: '#00B875',
    accentBg: '#e8f9f2',
    badgeText: 'OPay Direct',
  },

  // 2. ECOBANK ACCOUNT CONFIGURATION
  ecobank: {
    bankName: 'EcoBank',
    displayName: 'EcoBank',
    tagline: 'Direct Commercial Bank Transfer',
    accountName: 'Idris Abdulrazaq',
    accountNumber: '2792025013',
    qrCodeUrl: '/ecobank-qr.png',
    brandColor: '#005B94',
    accentBg: '#eaf4fa',
    badgeText: 'EcoBank Direct',
  },
};
