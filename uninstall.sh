#!/bin/bash
set -e

echo "========================================="
echo "  OpenClaw External Telegram 卸载"
echo "========================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 停止服务
echo ">>> 步骤 1: 停止服务"

# 尝试 pm2
if command -v pm2 &> /dev/null; then
    if pm2 describe openclaw-external-telegram &> /dev/null; then
        pm2 stop openclaw-external-telegram
        pm2 delete openclaw-external-telegram
        pm2 save
        echo "✅ 已停止 pm2 服务"
    fi
fi

# 尝试 systemd
if systemctl --user list-unit-files | grep -q "openclaw-external-telegram.service"; then
    systemctl --user stop openclaw-external-telegram.service 2>/dev/null || true
    systemctl --user disable openclaw-external-telegram.service 2>/dev/null || true
    rm -f "$HOME/.config/systemd/user/openclaw-external-telegram.service"
    systemctl --user daemon-reload 2>/dev/null || true
    echo "✅ 已停止 systemd 服务"
fi

echo ""

# 恢复 OpenClaw 配置
echo ">>> 步骤 2: 恢复 OpenClaw 配置"

OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"

# 查找最新的备份文件
BACKUP_FILE=$(ls -t "$HOME/.openclaw/openclaw.json.external_telegram_backup_"* 2>/dev/null | head -n 1 || true)

if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    cp "$BACKUP_FILE" "$OPENCLAW_CONFIG"
    echo "✅ 已恢复配置: $BACKUP_FILE"
    
    # 删除备份文件
    rm -f "$BACKUP_FILE"
    echo "✅ 备份文件已删除"
else
    # 没有备份，需要手动还原 telegram 配置
    if [ -f "$OPENCLAW_CONFIG" ]; then
        echo "⚠️ 未找到备份文件，OpenClaw 配置未变更"
    fi
fi

echo ""

# 删除项目文件
echo ">>> 步骤 3: 删除项目文件"

# 确认删除
read -p "确定要删除 $SCRIPT_DIR 目录吗? [y/N]: " CONFIRM < /dev/tty
if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    cd "$HOME"
    rm -rf "$SCRIPT_DIR"
    echo "✅ 项目文件已删除"
else
    echo "⚠️ 取消删除"
fi

echo ""
echo "========================================="
echo "  卸载完成"
echo "========================================="
echo ""
echo "如果需要重新使用 Telegram 信道，请运行:"
echo "  openclaw configure --section channels"
echo ""