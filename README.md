# OpenClaw External Telegram

OpenClaw 外部 Telegram 代理，提供进度条功能支持。

## 功能

- `/progress on` - 开启进度条模式（自动开启 verbose）
- `/progress off` - 关闭进度条模式（自动关闭 verbose）
- `/verbose on` - 只开启 verbose，原样显示日志
- `/verbose off` - 只关闭 verbose，原样显示日志

## 一键安装

```bash
# 安装（需要先从 GitHub 克隆）
curl -sSL https://raw.githubusercontent.com/lch541/openclaw-external-telegram/main/install.sh | bash
```

或者手动安装：

```bash
# 克隆项目
git clone https://github.com/lch541/openclaw-external-telegram.git
cd openclaw-external-telegram

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 Telegram Bot Token

# 运行
npm run dev
```

## 一键卸载

```bash
# 卸载（会停止服务、恢复配置、删除文件）
curl -sSL https://raw.githubusercontent.com/lch541/openclaw-external-telegram/main/uninstall.sh | bash
```

## 配置

安装时会交互式询问：

1. **Telegram Bot Token** - 从 @BotFather 获取
2. **OpenClaw API 地址** - 默认 `http://localhost:3000`

配置文件保存在 `.env` 文件中：

```
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
OPENCLAW_API_URL=http://localhost:3000
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

安装脚本会自动：
1. 停止 OpenClaw 原有 Telegram 信道
2. 配置 external-telegram
3. 启动服务（pm2 或 systemd）

## 手动管理

```bash
# 启动
npm run dev

# 停止
pm2 stop openclaw-external-telegram

# 查看日志
pm2 logs openclaw-external-telegram
```

## License

MIT