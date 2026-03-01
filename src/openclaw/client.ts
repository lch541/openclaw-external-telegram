import { spawn } from 'child_process';
import { config } from '../config.js';

export class OpenClawClient {
  private channel: string;

  constructor(channel: string = 'telegram') {
    this.channel = channel;
  }

  // 发送消息给 OpenClaw，返回响应文本
  async sendMessage(chatId: number, text: string): Promise<string> {
    return new Promise((resolve) => {
      console.log(`[OpenClaw] 发送消息: ${text.slice(0, 50)}...`);

      // 使用 openclaw agent 命令
      const args = [
        'agent',
        '--message', text,
        '--channel', this.channel,
        '--json',
        '--timeout', '120'
      ];

      const process = spawn('openclaw', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          console.error('[OpenClaw] 错误:', stderr);
          resolve(`❌ 错误: ${stderr.slice(0, 100)}`);
          return;
        }

        try {
          // 解析 JSON 响应
          const response = JSON.parse(stdout);
          const reply = response.reply || response.message || '';
          console.log(`[OpenClaw] 收到响应: ${reply.slice(0, 50)}...`);
          resolve(reply);
        } catch (error: any) {
          // 如果不是 JSON，直接返回原始输出
          if (stdout.trim()) {
            resolve(stdout.trim());
          } else {
            resolve(`❌ 解析响应失败`);
          }
        }
      });

      // 超时处理
      setTimeout(() => {
        process.kill();
        resolve('❌ 请求超时');
      }, 120000);
    });
  }
}

export const openclawClient = new OpenClawClient();