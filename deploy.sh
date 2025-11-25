#!/bin/bash

# 🎮 Автоматический деплой Ninja Chase Game на GitHub Pages
# Автор: Claude AI

set -e  # Остановиться при ошибке

echo "🎮 Ninja Chase Game - Автоматический деплой"
echo "==========================================="
echo ""

# Проверка git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен! Установи: sudo apt install git"
    exit 1
fi

# Проверка наличия проекта
if [ ! -d "ninja-game-project" ]; then
    echo "❌ Папка ninja-game-project не найдена!"
    echo "Сначала разархивируй проект в текущей директории."
    exit 1
fi

cd ninja-game-project

# Запрос данных
echo "📝 Настройка проекта..."
echo ""
read -p "Введи твой GitHub username (sjakaev): " GITHUB_USER
GITHUB_USER=${GITHUB_USER:-sjakaev}

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

echo "✅ vite.config.js настроен!"

# Инициализация git
echo ""
echo "📦 Инициализация Git..."
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git инициализирован"
else
    echo "ℹ️  Git уже инициализирован"
fi

# Добавление файлов
echo ""
echo "📝 Добавление файлов..."
git add .

# Коммит
echo ""
echo "💾 Создание коммита..."
git commit -m "🎮 Initial commit - Ninja Chase Multiplayer Game" || echo "ℹ️  Нет изменений для коммита"

# Настройка remote
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"
echo ""
echo "🔗 Настройка remote: ${REPO_URL}"

if git remote | grep -q "origin"; then
    git remote set-url origin ${REPO_URL}
    echo "✅ Remote обновлён"
else
    git remote add origin ${REPO_URL}
    echo "✅ Remote добавлен"
fi

# Переименование ветки
git branch -M main

echo ""
echo "==========================================="
echo "✨ Подготовка завершена!"
echo ""
echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
echo ""
echo "1️⃣  Создай репозиторий на GitHub:"
echo "   https://github.com/new"
echo "   Название: ${REPO_NAME}"
echo "   Сделай его PUBLIC"
echo ""
echo "2️⃣  Запусти деплой:"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Включи GitHub Pages:"
echo "   Settings → Pages → Source: GitHub Actions"
echo ""
echo "4️⃣  Твоя игра будет на:"
echo "   https://${GITHUB_USER}.github.io/${REPO_NAME}/"
echo ""
echo "==========================================="
echo ""
echo "⚠️  ВАЖНО: Для пуша нужна аутентификация!"
echo ""
echo "Варианты:"
echo "A) Personal Access Token:"
echo "   1. https://github.com/settings/tokens"
echo "   2. Generate new token (classic)"
echo "   3. Выбери: repo (все галочки)"
echo "   4. Generate token"
echo "   5. При git push введи token как пароль"
echo ""
echo "B) SSH ключ (рекомендуется):"
echo "   1. ssh-keygen -t ed25519 -C 'your@email.com'"
echo "   2. cat ~/.ssh/id_ed25519.pub"
echo "   3. Скопируй и добавь на: https://github.com/settings/keys"
echo "   4. Измени remote: git remote set-url origin git@github.com:${GITHUB_USER}/${REPO_NAME}.git"
echo "   5. git push -u origin main"
echo ""
echo "🚀 Готов к запуску! Удачи!"
