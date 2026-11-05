import type { IncomingMessage, ServerResponse } from 'http';
import {
  registerUser,
  loginUser,
  createGuestUser,
  saveCityProgress,
  loadCityProgress,
  getAllUsers
} from './serverStorage';

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      // Giới hạn 20MB cho các file save game lớn
      if (data.length > 20 * 1024 * 1024) {
        reject(new Error('Dữ liệu gửi lên server quá lớn (vượt quá 20MB)'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(new Error('JSON gửi lên không hợp lệ'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(payload));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const url = req.url || '';

  // Chỉ xử lý các endpoint bắt đầu bằng /api/
  if (!url.startsWith('/api/')) {
    return false;
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return true;
  }

  try {
    // 1. Kiểm tra trạng thái Server: GET /api/status
    if (url === '/api/status' && req.method === 'GET') {
      const users = getAllUsers();
      sendJson(res, 200, {
        status: 'online',
        server: 'Mini Metro Server Node.js',
        storageType: 'Server Filesystem (server-storage/)',
        totalUsers: users.length,
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // 2. Đăng ký tài khoản: POST /api/auth/register
    if (url === '/api/auth/register' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const user = registerUser(body.username || '', body.password || '');
      sendJson(res, 200, {
        success: true,
        profile: {
          uid: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      });
      return true;
    }

    // 3. Đăng nhập: POST /api/auth/login
    if (url === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const user = loginUser(body.username || '', body.password || '');
      sendJson(res, 200, {
        success: true,
        profile: {
          uid: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        }
      });
      return true;
    }

    // 4. Đăng nhập khách: POST /api/auth/guest
    if (url === '/api/auth/guest' && req.method === 'POST') {
      const guest = createGuestUser();
      sendJson(res, 200, {
        success: true,
        profile: {
          uid: guest.id,
          username: guest.username,
          email: guest.email,
          createdAt: guest.createdAt,
          lastLoginAt: guest.lastLoginAt
        }
      });
      return true;
    }

    // 5. Lưu tiến trình thành phố: POST /api/saves
    if (url === '/api/saves' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.userId || !body.cityId || !body.saveJson) {
        sendJson(res, 400, { success: false, error: 'Thiếu thông tin userId, cityId hoặc saveJson' });
        return true;
      }
      const saved = saveCityProgress(
        body.userId,
        body.cityId,
        body.saveJson,
        body.totalPassengers || 0,
        body.totalDays || 0
      );
      sendJson(res, 200, { success: true, saved });
      return true;
    }

    // 6. Tải tiến trình thành phố: GET /api/saves/:userId/:cityId
    const savesMatch = url.match(/^\/api\/saves\/([^/]+)\/([^/?]+)/);
    if (savesMatch && req.method === 'GET') {
      const userId = decodeURIComponent(savesMatch[1]);
      const cityId = decodeURIComponent(savesMatch[2]);
      const data = loadCityProgress(userId, cityId);
      if (data) {
        sendJson(res, 200, { success: true, data });
      } else {
        sendJson(res, 404, { success: false, error: 'Chưa có file save trên server' });
      }
      return true;
    }

    // Endpoint không tồn tại
    sendJson(res, 404, { success: false, error: 'Endpoint API không tồn tại' });
    return true;
  } catch (err: any) {
    sendJson(res, 400, { success: false, error: err?.message || String(err) });
    return true;
  }
}

