import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config.js';
import { openclawClient } from '../openclaw/client.js';
import { progressState, detectVerboseState } from '../progress/state.js';
import { formatProgressBar } from '../progress/bar.js';

export class TelegramClient {
  private bot: TelegramBot;
  private isRunning: boolean = false;

  constructor(token: string) {
    // 使用 polling 模式
    this.bot = new TelegramBot(token, { polling: true });
    this.setupMessageHandler();
    this.setupCommands();
  }

  private setupCommands() {
    // 注册命令
    this.bot.onText(/\/progress (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const subCmd = match?.[1];

      if (subCmd === 'on') {
        // 转发 /verbose on 给 OpenClaw
        await openclawClient.sendMessage(chatId, '/verbose on');
        progressState.enable();
        await this.bot.sendMessage(chatId, '✅ 进度条模式已开启');
      } else if (subCmd === 'off') {
        await openclawClient.sendMessage(chatId, '/verbose off');
        progressState.disable();
        await this.bot.sendMessage(chatId, '⚪ 进度条模式已关闭');
      } else {
        await this.bot.sendMessage(chatId, '❓ 用法: /progress on | off');
      }
    });

    // /verbose 命令不拦截，直接转发
    this.bot.onText(/\/verbose (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const text = match?.[0] || '';
      await this.forwardToOpenClaw(chatId, text);
    });
  }

  private setupMessageHandler() {
    this.bot.on('message', async (msg) => {
      // 忽略命令消息（已由 onText 处理）
      if (msg.text?.startsWith('/')) {
        return;
      }

      const chatId = msg.chat.id;
      const text = msg.text;

      if (!text) return;

      // 转发给 OpenClaw 并处理响应
      await this.forwardToOpenClaw(chatId, text);
    });
  }

  private async forwardToOpenClaw(chatId: number, text: string) {
    try {
      // 发送消息给 OpenClaw
      const response = await openclawClient.sendMessage(chatId, text);

      // 处理响应
      await this.handleOpenClawResponse(chatId, response);
    } catch (error: any) {
      console.error('处理消息失败:', error);
      await this.bot.sendMessage(chatId, `❌ 错误: ${error.message}`);
    }
  }

  private async handleOpenClawResponse(chatId: number, response: string) {
    // 1. 检测 verbose 状态变化
    const stateChange = detectVerboseState(response);
    if (stateChange === 'enable') {
      progressState.enable();
      console.log('检测到 Verbose 模式开启');
    } else if (stateChange === 'disable') {
      progressState.disable();
      console.log('检测到 Verbose 模式关闭');
    }

    // 2. 进度条处理
    if (progressState.isEnabled()) {
      const { chatId: currentChatId, messageId: currentMessageId } = progressState.getCurrentMessage();

      // 判断是否为中间过程日志
      const isLog = response.length < 200 && (
        response.includes('...') ||
        response.includes('读取') ||
        response.includes('分析') ||
        response.includes('搜索') ||
        response.includes('Thinking') ||
        response.includes('Analyzing') ||
        response.includes('Searching') ||
        response.includes('🔄')
      );

      if (isLog) {
        const progressBar = formatProgressBar(response);

        if (!currentMessageId || currentChatId !== chatId.toString()) {
          // 发送新的进度条消息
          const msg = await this.bot.sendMessage(chatId, progressBar);
          progressState.setCurrentMessage(chatId.toString(), msg.message_id);
        } else {
          // 更新现有进度条
          try {
            await this.bot.editMessageText(progressBar, {
              chat_id: chatId,
              message_id: currentMessageId,
            });
          } catch (error: any) {
            console.error('更新进度条失败:', error.message);
            // 如果编辑失败（如消息太旧），发送新消息
            const msg = await this.bot.sendMessage(chatId, progressBar);
            progressState.setCurrentMessage(chatId.toString(), msg.message_id);
          }
        }
        return;
      } else if (currentMessageId && currentChatId === chatId.toString()) {
        // 最终回复，替换进度条
        try {
          await this.bot.editMessageText(response, {
            chat_id: chatId,
            message_id: currentMessageId,
          });
        } catch (error: any) {
          console.error('替换进度条失败:', error.message);
          await this.bot.sendMessage(chatId, response);
        }
        progressState.clearCurrentMessage();
        return;
      }
    }

    // 3. 普通消息发送
    if (!progressState.isEnabled() || !progressState.getCurrentMessage().messageId) {
      await this.bot.sendMessage(chatId, response);
    }
  }

  // 发送消息
  async sendMessage(chatId: number, text: string) {
    return await this.bot.sendMessage(chatId, text);
  }

  // 编辑消息
  async editMessage(chatId: number, messageId: number, text: string) {
    return await this.bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
    });
  }

  stop() {
    this.isRunning = false;
    this.bot.stopPolling();
  }
}