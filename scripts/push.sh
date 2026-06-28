#!/bin/bash
set -e

echo "📋 代码检查..."
npx astro check

echo "🎨 格式化代码..."
# 记录格式化前是否有用户的未提交修改（非 prettier 产生的）
BEFORE_UNCOMMITTED=$(git diff HEAD --name-only)

npx prettier --write .

echo "📦 暂存所有变更..."
git add -A

# 检查是否有变更
CHANGED=$(git diff --cached --name-only)
if [ -z "$CHANGED" ]; then
  echo "ℹ️  没有新的变更需要提交"
elif [ -n "$BEFORE_UNCOMMITTED" ]; then
  # 有用户的主动修改 → 创建新提交（格式化改动会包含在内）
  echo "📝 填写 commit 信息..."
  GIT_EDITOR="zeditor --wait" git commit
else
  # 只有 prettier 的格式化改动 → 合并到最近一次提交
  echo "🔧 合并格式化变更到最近一次提交..."
  git commit --amend --no-edit
fi

echo "🚀 推送..."
git push

echo "✅ 完成！"
