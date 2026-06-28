#!/bin/bash
set -e

echo "📋 代码检查..."
npx astro check

echo "🎨 格式化代码..."
npx prettier --write .

echo "📦 暂存所有变更..."
git add -A

# 检查是否有变更
CHANGED=$(git diff --cached --name-only)
if [ -z "$CHANGED" ]; then
  echo "ℹ️  没有新的变更需要提交"
else
  echo "📝 填写 commit 信息（vim）..."
  GIT_EDITOR=vim git commit
fi

echo "🚀 推送..."
git push

echo "✅ 完成！"
