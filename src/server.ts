import { config } from './config.js';
import { TelegramClient } from './telegram/client.js';

async function main() {
  if (!config.telegramToken) {
    console.error('错误: 请设置 TELEGRAM_BOT_TOKEN 环境变量');
    process.exit(1);
  }

  console.log('=========================================');
  console.log('  OpenClaw External Telegram');
  console.log('  进度条支持 for Telegram');
  console.log('=========================================');
  console.log('');
  console.log(`配置:`);
  console.log(`  Telegram Token: ${config.telegramToken.slice(0, 10)}...`);
  console.log(`  OpenClaw API: ${config.openclawApiUrl}`);
  console.log('');

  try {
    const telegramClient = new TelegramClient(config.telegramToken);

    console.log('✅ External Telegram 已启动');
    console.log('📝 可用命令:');
    console.log('   /progress on  - 开启进度条模式');
    console.log('   /progress off - 关闭进度条模式');
    console.log('   /verbose on  - 只开启 verbose（不拦截）');
    console.log('   /verbose off - 只关闭 verbose（不拦截）');
    console.log('');
    console.log('监听中...');

    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n正在停止...');
      telegramClient.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n正在停止...');
      telegramClient.stop();
      process.exit(0);
    });

  } catch (error: any) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

main();