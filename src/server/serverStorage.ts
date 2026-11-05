import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'server-storage');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SAVES_DIR = path.join(DATA_DIR, 'saves');

// Đảm bảo thư mục server-storage luôn tồn tại
function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SAVES_DIR)) {
    fs.mkdirSync(SAVES_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

export interface ServerUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface ServerSaveData {
  userId: string;
  cityId: string;
  saveJson: string;
  version: number;
  totalPassengers: number;
  totalDays: number;
  updatedAt: string;
}

// Băm mật khẩu an toàn với salt cố định cho server
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_metro_salt_2026').digest('hex');
}

export function getAllUsers(): ServerUser[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAllUsers(users: ServerUser[]) {
  ensureStorage();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export function registerUser(username: string, password: string): ServerUser {
  const cleanName = username.trim();
  if (cleanName.length < 3) throw new Error('Tên người dùng phải có ít nhất 3 ký tự.');
  if (password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');

  const users = getAllUsers();
  const normalized = cleanName.toLowerCase();
  const exists = users.find(u => u.username.toLowerCase() === normalized);

  if (exists) {
    throw new Error('Tên người dùng này đã có người đăng ký trên Server! Vui lòng chọn tên khác hoặc bấm Đăng nhập.');
  }

  const id = 'usr_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
  const now = new Date().toISOString();
  const newUser: ServerUser = {
    id,
    username: cleanName,
    email: `${cleanName}@metro.server`,
    passwordHash: hashPassword(password),
    createdAt: now,
    lastLoginAt: now
  };

  users.push(newUser);
  saveAllUsers(users);
  return newUser;
}

export function loginUser(username: string, password: string): ServerUser {
  const cleanName = username.trim();
  const users = getAllUsers();
  const normalized = cleanName.toLowerCase();
  const user = users.find(u => u.username.toLowerCase() === normalized);

  if (!user) {
    throw new Error('Không tìm thấy tài khoản này trên Server! Hãy chuyển sang mục "Đăng ký" để tạo tài khoản mới.');
  }

  const pHash = hashPassword(password);
  if (user.passwordHash !== pHash) {
    throw new Error('Mật khẩu không chính xác!');
  }

  user.lastLoginAt = new Date().toISOString();
  saveAllUsers(users);
  return user;
}

export function createGuestUser(): ServerUser {
  ensureStorage();
  const guestCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const guestName = `Khách_${guestCode}`;
  const now = new Date().toISOString();
  const id = `guest_${Date.now().toString(36)}_${crypto.randomBytes(2).toString('hex')}`;

  const guest: ServerUser = {
    id,
    username: guestName,
    email: `${guestName}@metro.guest`,
    passwordHash: '',
    createdAt: now,
    lastLoginAt: now
  };

  const users = getAllUsers();
  users.push(guest);
  saveAllUsers(users);
  return guest;
}

// Lưu tiến trình thành phố lên Server (Lưu thành file riêng cho mỗi user & city)
export function saveCityProgress(
  userId: string,
  cityId: string,
  saveJson: string,
  totalPassengers = 0,
  totalDays = 0
): ServerSaveData {
  ensureStorage();
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeCityId = cityId.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${safeUserId}_${safeCityId}.json`;
  const filePath = path.join(SAVES_DIR, fileName);

  const data: ServerSaveData = {
    userId,
    cityId,
    saveJson,
    version: 3,
    totalPassengers,
    totalDays,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  return data;
}

// Tải tiến trình thành phố từ Server
export function loadCityProgress(userId: string, cityId: string): ServerSaveData | null {
  ensureStorage();
  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeCityId = cityId.replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `${safeUserId}_${safeCityId}.json`;
  const filePath = path.join(SAVES_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

