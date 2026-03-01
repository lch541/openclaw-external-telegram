#!/bin/bash
set -e

echo "========================================="
echo "  OpenClaw External Telegram 一键安装"
echo "========================================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js，请先安装 Node.js 18+"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未安装 npm，请先安装 Node.js"
    exit 1
fi

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ">>> 步骤 1: 安装依赖"
npm install --production
echo "✅ 依赖安装完成"
echo ""

# 配置环境变量
echo ">>> 步骤 2: 配置环境变量"

# 读取现有配置（如果存在）
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
    echo "检测到现有配置"
fi

# 交互式输入
read -p "请输入 Telegram Bot Token (从 @BotFather 获取): " TELEGRAM_TOKEN < /dev/tty
TELEGRAM_TOKEN=${TELEGRAM_TOKEN:-$TELEGRAM_BOT_TOKEN}

read -p "请输入 OpenClaw API 地址 (默认: http://localhost:3000): " OC_API < /dev/tty
OC_API=${OC_API:-$OPENCLAW_API_URL}
OC_API=${OC_API:-http://localhost:3000}

# 写入配置
cat > "$SCRIPT_DIR/.env" << EOF
TELEGRAM_BOT_TOKEN=$TELEGRAM_TOKEN
OPENCLAW_API_URL=$OC_API
PROXY_PORT=3345
EOF

echo "✅ 配置已保存到 .env"
echo ""

# 配置 OpenClaw
echo ">>> 步骤 3: 配置 OpenClaw Telegram 信道"

# 查找 OpenClaw 配置
OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"
if [ ! -f "$OPENCLAW_CONFIG" ]; then
    ALT_CONFIG=$(ls /home/*/.openclaw/openclaw.json 2>/dev/null | head -n 1 || true)
    if [ -n "$ALT_CONFIG" ]; then
        OPENCLAW_CONFIG="$ALT_CONFIG"
    fi
fi

if [ ! -f "$OPENCLAW_CONFIG" ]; then
    echo "⚠️ 未找到 OpenClaw 配置文件，跳过信道配置"
    echo "   请手动将 Telegram bot token 配置到 external-telegram 的环境变量中"
else
    # 备份配置
    BACKUP_FILE="${OPENCLAW_CONFIG}.external_telegram_backup_$(date +%Y%m%d%H%M%S)"
    cp "$OPENCLAW_CONFIG" "$BACKUP_FILE"
    echo "✅ 已备份配置到: $BACKUP_FILE"

    # 使用 Node.js 修改配置
    node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$OPENCLAW_CONFIG', 'utf8'));

// 移除现有的 telegram 配置
if (config.channels && config.channels.telegram) {
    // 保留 token 但修改配置
    const oldToken = config.channels.telegram.botToken;
    config.channels.telegram = {
        enabled: true,
        botToken: '$TELEGRAM_TOKEN',
        dmPolicy: 'open',
        groupPolicy: 'allowlist',
        allowFrom: ['*'],
        streaming: 'off'
    };
}

// 写入配置
fs.writeFileSync('$OPENCLAW_CONFIG', JSON.stringify(config, null, 2));
console.log('配置已更新');
"

    echo "✅ OpenClaw Telegram 信道已配置"
fi

echo ""
echo ">>> 步骤 4: 启动服务"

# 检查是否已有进程运行
if command -v pm2 &> /dev/null; then
    pm2 delete openclaw-external-telegram &> /dev/null || true
    pm2 start npm --name "openclaw-external-telegram" -- run dev
    pm2 save
    echo "✅ 已通过 pm2 启动服务"
    echo "   使用 'pm2 logs openclaw-external-telegram' 查看日志"
else
    # 使用 systemd
    echo "检测到 pm2 未安装，使用 systemd 方式..."
    
    # 创建 systemd 服务
    SERVICE_DIR="$HOME/.config/systemd/user"
    mkdir -p "$SERVICE_DIR"
    NPM_PATH=$(command -v npm)
    
    cat > "$SERVICE_DIR/openclaw-external-telegram.service" << EOF
[Unit]
Description=OpenClaw External Telegram
After=network.target

[Service]
Type=simple
WorkingDirectory=$SCRIPT_DIR
ExecStart=$NPM_PATH run dev
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

    systemctl --user daemon-reload
    systemctl --user enable --now openclaw-external-telegram.service
    
    # 启用 linger
    if command -v loginctl &> /dev/null; then
        loginctl enable-linger $USER || true
    fi
    
    echo "✅ 已通过 systemd 启动服务"
    echo "   使用 'systemctl --user status openclaw-external-telegram' 查看日志"
fi

echo ""
echo "========================================="
echo "  安装完成！"
echo "========================================="
echo ""
echo "配置信息:"
echo "  Telegram Token: ${TELEGRAM_TOKEN:0:10}..."
echo "  OpenClaw API: $OC_API"
echo ""
echo "下一步:"
echo "  1. 在 Telegram 中与 bot 发送 /start"
echo "  2. 尝试 /progress on 开启进度条"
echo ""