# OpenClaw External Telegram

OpenClaw 外部 Telegram 代理，提供进度条功能支持。

## 功能

- `/progress on` - 开启进度条模式（自动开启 verbose）
- `/progress off` - 关闭进度条模式（自动关闭 verbose）
- `/verbose on` - 只开启 verbose，原样显示日志
- `/verbose off` - 只关闭 verbose，原样显示日志

## 安装

```bash
# 克隆项目
git clone https://github.com/lch541/openclaw-external-telegram.git
cd openclaw-external-telegram

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 Telegram Bot Token
```

## 配置

编辑 `.env` 文件：

```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
OPENCLAW_API_URL=http://localhost:3000
```

## 运行

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

## 命令说明

| 命令 | 处理方式 | 功能 |
|------|----------|------|
| `/progress on` | 拦截 → 转为 `/verbose on` | 开启进度条模式 |
| `/progress off` | 拦截 → 转为 `/verbose off` | 关闭进度条模式 |
| `/verbose on` | 不拦截，直接转发 | 只开启 verbose |
| `/verbose off` | 不拦截，直接转发 | 只关闭 verbose |

## 进度条效果

```
🔄 处理中 [████████░░] 80% - 读取文件...
```

处理完成后，进度条会自动替换为最终回复。

## 与 OpenClaw 集成

1. 停止 OpenClaw 的 Telegram 信道
2. 配置 external-telegram 连接你的 OpenClaw API
3. 通过 external-telegram 与 OpenClaw 通信

## License

MIT