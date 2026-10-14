#!/bin/bash
# Хук старта облачной сессии Claude Code: ставит зависимости, чтобы сразу работали
# npm run build / test / test:e2e и pytest (S1.02, docs/implementation/PLAN.md).
set -euo pipefail

# Только в облачной сессии; локально зависимости ставит человек.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

# Сайт: npm install, а не npm ci — так переиспользуется кэш контейнера; lockfile не меняется.
npm install --no-audit --no-fund --loglevel=error

# Python: venv в .venv (в .gitignore) с пакетом mlf и инструментами проверок.
if [ ! -x .venv/bin/python ]; then
  python3 -m venv .venv
fi
.venv/bin/python -m pip install --quiet --upgrade pip
.venv/bin/python -m pip install --quiet -e "code[dev]"

# venv — первым в PATH для всей сессии: python, pytest, jupytext.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$PWD/.venv/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi
