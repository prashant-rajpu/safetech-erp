#!/bin/sh
# Safetech ERP — sync source from the canonical folder on the SD-card mount
# to /root/build (ext4, where node can execute native modules) and start
# the Vite dev server exposed on the local network.
#
# Usage:  sh scripts/dev-lan.sh          (from either copy of the repo)
#
# Why two folders: vite/rollup native binaries cannot execute from the
# Android storage mount, so we edit in "/mnt/Gemini Cli/build" and run
# the toolchain from /root/build.

SRC="/mnt/Gemini Cli/build"
DST="/root/build"

echo "▸ Syncing source  $SRC  →  $DST"
cd "$SRC" || exit 1
tar cf - --exclude=node_modules --exclude=.git --exclude=dist . 2>/dev/null | (cd "$DST" && tar xf - 2>/dev/null)

cd "$DST" || exit 1
if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "▸ node_modules missing — running npm install"
  npm install --no-audit --no-fund
fi

IP=$(ip route get 1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1)}' | head -1)
echo ""
echo "▸ Starting Safetech ERP dev server on the LAN"
[ -n "$IP" ] && echo "  Open on other devices:  http://$IP:5173"
echo ""
exec npx vite --host
