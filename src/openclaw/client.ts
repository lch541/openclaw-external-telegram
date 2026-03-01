import axios from 'axios';
import { config } from '../config.js';

export class OpenClawClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || config.openclawApiUrl;
  }

  // 发送消息给 OpenClaw，返回响应文本
  async sendMessage(chatId: number, text: string): Promise<string> {
    try {
      // 这里需要根据你的 OpenClaw API 来调整
      // 假设 OpenClaw 提供 HTTP API 接收消息
      const response = await axios.post(`${this.baseUrl}/api/message`, {
        chatId,
        text,
      }, {
        timeout: 120000, // 2分钟超时
      });

      return response.data.reply || response.data.message || '';
    } catch (error: any) {
      console.error('发送消息到 OpenClaw 失败:', error.message);
      return `❌ 错误: ${error.message}`;
    }
  }
}

export const openclawClient = new OpenClawClient();