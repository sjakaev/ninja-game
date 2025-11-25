#!/bin/bash

# 🚀 Деплой через GitHub CLI (gh)
# Самый простой способ!

set -e

echo "🚀 Ninja Chase Game - Деплой через GitHub CLI"
echo "=============================================="
echo ""

# Проверка gh CLI
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI не установлен!"
    echo ""
    echo "📥 Установка:"
    echo ""
    echo "macOS:"
    echo "  brew install gh"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt install gh"
    echo ""
    echo "Windows:"
    echo "  winget install --id GitHub.cli"
    echo ""
    echo "Или скачай: https://cli.github.com/"
    exit 1
fi

cd ninja-game-project || exit 1

# Проверка авторизации
if ! gh auth status &> /dev/null; then
    echo "🔐 Требуется авторизация в GitHub..."
    echo ""
    gh auth login
fi

# Запрос данных
read -p "Название репозитория (ninja-game): " REPO_NAME
REPO_NAME=${REPO_NAME:-ninja-game}

# Обновление vite.config.js
echo ""
echo "🔧 Настройка vite.config.js..."
cat > vite.config.js << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/${REPO_NAME}/',
})
EOF

# Создание репозитория
echo ""
echo "📦 Создание репозитория на GitHub..."
gh repo create ${REPO_NAME} --public --source=. --remote=origin

# Инициализация git если нужно
if [ ! -d ".git" ]; then
    git init
fi

# Коммит и пуш
echo ""
echo "💾 Коммит и пуш..."
git add .
git commit -m "🎮 Ninja Chase Multiplayer Game" || echo "Нет изменений"
git branch -M main
git push -u origin main

echo ""
echo "✨ Репозиторий создан и код загружен!"
echo ""
echo "📋 ПОСЛЕДНИЙ ШАГ:"
echo ""
echo "Включи GitHub Pages:"
echo "  gh repo edit --enable-pages --pages-source-branch main"
echo ""
echo "Или вручную:"
echo "  Settings → Pages → Source: GitHub Actions"
echo ""

# Получить URL
GITHUB_USER=$(gh api user --jq .login)
echo "🎮 Твоя игра будет на:"
echo "   https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo ""
echo "Готово! 🎉"
