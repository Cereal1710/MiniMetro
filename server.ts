import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { handleApiRequest } from './src/server/apiRouter';

const app = express();
const PORT = process.env.PORT || 3000;

const distPath = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distPath, 'index.html');

// Tự động build frontend nếu thư mục dist chưa được tạo trên Render
if (!fs.existsSync(indexPath)) {
  console.log('📦 Chưa tìm thấy dist/index.html. Đang tự động build frontend...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Đã build xong frontend vào dist/ thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi tự động build:', err);
  }
}

// API Endpoints
app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res);
    if (handled) return;
  }
  next();
});

// Phục vụ frontend tĩnh đã build trong thư mục dist
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// SPA Fallback: chuyển mọi route về index.html
app.get('*', (_req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h2>🚂 Server đang nạp dữ liệu game...</h2>
        <p>Vui lòng đợi vài giây và bấm tải lại trang (F5).</p>
      </div>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`🚂 Mini Metro Server đang chạy tại http://localhost:${PORT}`);
  console.log(`💾 Dữ liệu Server được lưu tại: ${path.resolve(process.cwd(), 'server-storage')}`);
});
