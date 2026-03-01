import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  openclawApiUrl: process.env.OPENCLAW_API_URL || 'http://localhost:3000',
  proxyPort: parseInt(process.env.PROXY_PORT || '3345', 10),
};