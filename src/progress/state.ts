const VERBOSE_ENABLE_KEYWORDS = [
  '进度条模式已开启',
  'verbose mode enabled',
  'verbose on',
];

const VERBOSE_DISABLE_KEYWORDS = [
  '进度条模式已关闭',
  'verbose mode disabled',
  'verbose off',
];

export function detectVerboseState(message: string): 'enable' | 'disable' | null {
  const lowerMessage = message.toLowerCase();
  
  if (VERBOSE_ENABLE_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()))) {
    return 'enable';
  }
  if (VERBOSE_DISABLE_KEYWORDS.some(k => lowerMessage.includes(k.toLowerCase()))) {
    return 'disable';
  }
  return null;
}

interface ProgressState {
  progressEnabled: boolean;
  currentMessageId: number | null;
  currentChatId: string | null;
}

class ProgressStateManager {
  private state: ProgressState = {
    progressEnabled: false,
    currentMessageId: null,
    currentChatId: null,
  };

  enable() { this.state.progressEnabled = true; }
  disable() { this.state.progressEnabled = false; }
  isEnabled() { return this.state.progressEnabled; }

  setCurrentMessage(chatId: string, messageId: number) {
    this.state.currentChatId = chatId;
    this.state.currentMessageId = messageId;
  }

  clearCurrentMessage() {
    this.state.currentChatId = null;
    this.state.currentMessageId = null;
  }

  getCurrentMessage() {
    return {
      chatId: this.state.currentChatId,
      messageId: this.state.currentMessageId,
    };
  }
}

export const progressState = new ProgressStateManager();