// =========================================================================
// MINI METRO - REAL SERVER STORAGE CLIENT (NODE.JS SERVER BACKEND)
// =========================================================================
// Toàn bộ dữ liệu người dùng và file save được gửi qua REST API
// và lưu trữ an toàn trên Ổ đĩa của SERVER (server-storage/).

export interface UserProfile {
  uid: string;
  username: string;
  email?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface CloudSaveData {
  userId: string;
  cityId: string;
  saveJson: string;
  version: number;
  totalPassengers: number;
  totalDays: number;
  updatedAt: string;
}

const STORAGE_ACTIVE_USER_KEY = 'metro_user_profile';

// Auth State Change Listeners
type AuthCallback = (user: { uid: string; displayName: string; email?: string } | null) => void;
const authListeners = new Set<AuthCallback>();

function notifyAuthListeners() {
  const current = getCachedUserProfile();
  const authPayload = current
    ? {
        uid: current.uid,
        displayName: current.username,
        email: current.email || `${current.username}@metro.server`
      }
    : null;

  authListeners.forEach((callback) => {
    try {
      callback(authPayload);
    } catch (e) {
      console.warn('Lỗi listener auth:', e);
    }
  });
}

// Đối tượng mô phỏng Auth cho game
export const auth = {
  get currentUser() {
    const current = getCachedUserProfile();
    if (!current) return null;
    return {
      uid: current.uid,
      displayName: current.username,
      email: current.email || `${current.username}@metro.server`,
      emailVerified: true,
      isAnonymous: current.uid.startsWith('guest_')
    };
  }
};

// Hàm lắng nghe trạng thái đăng nhập
export function onAuthStateChanged(_authInstance: any, callback: AuthCallback): () => void {
  authListeners.add(callback);
  const current = getCachedUserProfile();
  callback(
    current
      ? {
          uid: current.uid,
          displayName: current.username,
          email: current.email || `${current.username}@metro.server`
        }
      : null
  );

  return () => {
    authListeners.delete(callback);
  };
}

export function formatUsernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  if (clean.includes('@') && clean.includes('.')) {
    return clean;
  }
  const sanitized = clean.replace(/[^a-z0-9_]/g, '');
  return `${sanitized || 'player'}@metro.server`;
}

// =========================================================================
// 1. ĐĂNG KÝ TÀI KHOẢN MỚI TRÊN SERVER
// =========================================================================
export async function registerWithUsername(username: string, password: string): Promise<UserProfile> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Đăng ký tài khoản trên server thất bại');
  }

  const profile: UserProfile = data.profile;
  localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
  notifyAuthListeners();
  return profile;
}

// =========================================================================
// 2. ĐĂNG NHẬP TÀI KHOẢN TỪ SERVER
// =========================================================================
export async function loginWithUsername(username: string, password: string): Promise<UserProfile> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Đăng nhập tài khoản trên server thất bại');
  }

  const profile: UserProfile = data.profile;
  localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
  notifyAuthListeners();
  return profile;
}

// =========================================================================
// 3. ĐĂNG NHẬP KHÁCH TRÊN SERVER (1-CHẠM)
// =========================================================================
export async function loginAsGuest(): Promise<UserProfile> {
  try {
    const res = await fetch('/api/auth/guest', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      const profile: UserProfile = data.profile;
      localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
      notifyAuthListeners();
      return profile;
    }
  } catch (err) {
    console.warn('Lỗi kết nối server guest API, dùng tài khoản tạm:', err);
  }

  // Fallback tạm nếu server offline
  const guestName = `Khách_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const profile: UserProfile = {
    uid: `guest_${Date.now().toString(36)}`,
    username: guestName,
    email: undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
  notifyAuthListeners();
  return profile;
}

// =========================================================================
// 4. ĐĂNG XUẤT
// =========================================================================
export async function logoutUser(): Promise<void> {
  localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
  notifyAuthListeners();
}

// =========================================================================
// 5. LƯU TIẾN TRÌNH THÀNH PHỐ LÊN SERVER
// =========================================================================
export async function saveCityToCloud(
  userId: string,
  cityId: string,
  saveJson: string,
  totalPassengers = 0,
  totalDays = 0
): Promise<void> {
  // Gửi trực tiếp lên Server để lưu vào ổ cứng máy chủ
  const res = await fetch('/api/saves', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      cityId,
      saveJson,
      totalPassengers,
      totalDays
    })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Lỗi khi lưu tiến trình lên server');
  }

  // Lưu thêm 1 bản dự phòng trên trình duyệt để tải siêu nhanh
  try {
    localStorage.setItem(`metro_city_save_${userId}_${cityId}`, saveJson);
    localStorage.setItem(`city_save_${cityId}`, saveJson);
  } catch {}
}

// =========================================================================
// 6. TẢI TIẾN TRÌNH THÀNH PHỐ TỪ SERVER
// =========================================================================
export async function loadCityFromCloud(userId: string, cityId: string): Promise<string | null> {
  try {
    // 1. Tải trực tiếp từ Server
    const res = await fetch(`/api/saves/${encodeURIComponent(userId)}/${encodeURIComponent(cityId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.saveJson) {
        return data.data.saveJson;
      }
    }
  } catch (err) {
    console.warn('Lỗi khi tải từ server, kiểm tra bộ nhớ đệm:', err);
  }

  // 2. Dự phòng: Đọc từ cache trình duyệt nếu server mất kết nối
  const userSave = localStorage.getItem(`metro_city_save_${userId}_${cityId}`);
  if (userSave) return userSave;
  return localStorage.getItem(`city_save_${cityId}`);
}

// =========================================================================
// 7. LẤY HỒ SƠ ĐANG ĐĂNG NHẬP TRONG CACHE
// =========================================================================
export function getCachedUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
