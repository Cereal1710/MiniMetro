import express from 'express';
import path from 'path';
import { handleApiRequest } from './src/server/apiRouter';

const app = express();
const PORT = process.env.PORT || 3000;

// API Endpoints
app.use(async (req, res, next) => {
  if (req.url && req.url.startsWith('/api/')) {
    const handled = await handleApiRequest(req, res);
    if (handled) return;
  }
  next();
});

// Phục vụ frontend tĩnh đã build trong thư mục dist
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA Fallback: chuyển mọi route về index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚂 Mini Metro Server đang chạy tại http://localhost:${PORT}`);
  console.log(`💾 Dữ liệu Server được lưu tại: ${path.resolve(process.cwd(), 'server-storage')}`);
});

