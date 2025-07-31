#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 清除缓存文件...');

// 清除dist目录
const distPath = path.join(__dirname, '..', 'public', 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
  console.log('✅ 已清除 dist 目录');
}

// 清除node_modules/.cache (如果存在)
const cachePath = path.join(__dirname, '..', 'node_modules', '.cache');
if (fs.existsSync(cachePath)) {
  fs.rmSync(cachePath, { recursive: true, force: true });
  console.log('✅ 已清除 node_modules/.cache');
}

console.log('🎉 缓存清除完成！');
console.log('💡 提示: 在浏览器中按 Ctrl+Shift+R (或 Cmd+Shift+R) 强制刷新页面'); 