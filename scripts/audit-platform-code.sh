#!/bin/bash
# Audit script to check for platform-specific code in game-core package
# This ensures the game-core package remains platform-neutral

set -e

GAME_CORE_PATH="packages/game-core/src"
EXIT_CODE=0

echo "=========================================="
echo "Platform Neutrality Audit for game-core"
echo "=========================================="
echo ""

# Check for DOM references
echo "=== Checking for DOM References ==="
DOM_REFS=$(grep -r -n "document\|window\|localStorage\|sessionStorage\|navigator\|location\.href" "$GAME_CORE_PATH" 2>/dev/null || true)
if [ -n "$DOM_REFS" ]; then
  echo "❌ Found DOM references (browser-specific):"
  echo "$DOM_REFS"
  EXIT_CODE=1
else
  echo "✅ No DOM references found"
fi
echo ""

# Check for Node.js-specific APIs
echo "=== Checking for Node.js-Specific APIs ==="
NODE_REFS=$(grep -r -n "require('fs')\|require('path')\|process\.env\|__dirname\|__filename" "$GAME_CORE_PATH" 2>/dev/null || true)
if [ -n "$NODE_REFS" ]; then
  echo "❌ Found Node.js-specific APIs:"
  echo "$NODE_REFS"
  EXIT_CODE=1
else
  echo "✅ No Node.js-specific APIs found"
fi
echo ""

# Check for network calls
echo "=== Checking for Direct Network Calls ==="
NETWORK_REFS=$(grep -r -n "fetch(\|axios\|XMLHttpRequest\|\.get(\|\.post(" "$GAME_CORE_PATH" 2>/dev/null | grep -v "\.get\s*(" | grep -v "\/\/" || true)
if [ -n "$NETWORK_REFS" ]; then
  echo "⚠️  Found potential network calls:"
  echo "$NETWORK_REFS"
  echo "Note: Verify these are not actual HTTP calls"
  # Don't fail on this as .get() might be for Map/Object access
else
  echo "✅ No obvious network calls found"
fi
echo ""

# Check for file system access
echo "=== Checking for File System Access ==="
FS_REFS=$(grep -r -n "readFile\|writeFile\|mkdir\|rmdir\|unlink\|createWriteStream" "$GAME_CORE_PATH" 2>/dev/null || true)
if [ -n "$FS_REFS" ]; then
  echo "❌ Found file system access:"
  echo "$FS_REFS"
  EXIT_CODE=1
else
  echo "✅ No file system access found"
fi
echo ""

# Check for crypto usage (should use platform-provided if needed)
echo "=== Checking for Platform-Specific Crypto ==="
CRYPTO_REFS=$(grep -r -n "crypto\.randomBytes\|crypto\.createHash" "$GAME_CORE_PATH" 2>/dev/null || true)
if [ -n "$CRYPTO_REFS" ]; then
  echo "⚠️  Found platform-specific crypto usage:"
  echo "$CRYPTO_REFS"
  echo "Note: Crypto should be injected as dependency, not used directly"
else
  echo "✅ No platform-specific crypto usage found"
fi
echo ""

# Check for timers that aren't deterministic
echo "=== Checking for Non-Deterministic Time Functions ==="
TIME_REFS=$(grep -r -n "Date\.now()\|new Date()\|performance\.now()\|setTimeout\|setInterval" "$GAME_CORE_PATH" 2>/dev/null || true)
if [ -n "$TIME_REFS" ]; then
  echo "⚠️  Found non-deterministic time functions:"
  echo "$TIME_REFS"
  echo "Note: These should be injected via context for determinism"
else
  echo "✅ No non-deterministic time functions found"
fi
echo ""

# Summary
echo "=========================================="
echo "Audit Summary"
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ Platform neutrality check PASSED"
  echo "   game-core package is platform-neutral"
else
  echo "❌ Platform neutrality check FAILED"
  echo "   Found platform-specific code that must be refactored"
fi
echo ""

exit $EXIT_CODE
