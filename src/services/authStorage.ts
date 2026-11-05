// =========================================================================
// MINI METRO - LOCAL-FIRST USER & GAME STORAGE SERVICE
// =========================================================================
// Thay thế hoàn toàn Firebase: Lưu trữ tài khoản và tiến trình màn chơi
// trực tiếp trên trình duyệt (LocalStorage). Không lỗi mạng, không cần API Key,
// hoạt động 100% mượt mà và bền bỉ.

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

export interface UserAccountRecord {
  uid: string;
  username: string;
  passwordHash: string; // Base64 encoded or salted password string
  email?: string;
  createdAt: string;
  lastLoginAt: string;
}

// Storage Keys
const STORAGE_USERS_KEY = 'mini_metro_users_store_v1';
const STORAGE_ACTIVE_USER_KEY = 'metro_user_profile';
const STORAGE_CITY_SAVE_PREFIX = 'metro_city_save_';

// Helper: Lấy danh sách toàn bộ người dùng đã đăng ký trên máy
function getStoredUsersMap(): Record<string, UserAccountRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Lỗi đọc database người dùng:', err);
  }
  return {};
}

// Helper: Lưu danh sách người dùng vào LocalStorage
function persistUsersMap(users: Record<string, UserAccountRecord>) {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Lỗi ghi database người dùng:', err);
  }
}

// Auth State Change Listeners (Mô phỏng Firebase onAuthStateChanged)
type AuthCallback = (user: { uid: string; displayName: string; email?: string } | null) => void;
const authListeners = new Set<AuthCallback>();

function notifyAuthListeners() {
  const current = getCachedUserProfile();
  const authPayload = current
    ? {
        uid: current.uid,
        displayName: current.username,
        email: current.email || `${current.username}@metro.local`
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

// Đối tượng mô phỏng Firebase Auth
export const auth = {
  get currentUser() {
    const current = getCachedUserProfile();
    if (!current) return null;
    return {
      uid: current.uid,
      displayName: current.username,
      email: current.email || `${current.username}@metro.local`,
      emailVerified: true,
      isAnonymous: current.uid.startsWith('guest_')
    };
  }
};

// Hàm lắng nghe sự thay đổi trạng thái đăng nhập
export function onAuthStateChanged(_authInstance: any, callback: AuthCallback): () => void {
  authListeners.add(callback);
  // Gọi ngay lập tức với trạng thái hiện tại
  const current = getCachedUserProfile();
  callback(
    current
      ? {
          uid: current.uid,
          displayName: current.username,
          email: current.email || `${current.username}@metro.local`
        }
      : null
  );

  return () => {
    authListeners.delete(callback);
  };
}

// Định dạng username sang dạng email hiển thị
export function formatUsernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase();
  if (clean.includes('@') && clean.includes('.')) {
    return clean;
  }
  const sanitized = clean.replace(/[^a-z0-9_]/g, '');
  return `${sanitized || 'player'}@metro.com`;
}

// =========================================================================
// 1. ĐĂNG KÝ TÀI KHOẢN MỚI
// =========================================================================
export async function registerWithUsername(username: string, password: string): Promise<UserProfile> {
  const cleanUsername = username.trim();
  if (cleanUsername.length < 3) {
    throw new Error('Tên người dùng phải có ít nhất 3 ký tự.');
  }
  if (password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  const users = getStoredUsersMap();
  const normalizedKey = cleanUsername.toLowerCase();

  if (users[normalizedKey]) {
    throw new Error('Tên người dùng này đã có người đăng ký trên máy! Hãy chọn tên khác hoặc bấm Đăng nhập.');
  }

  const uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const now = new Date().toISOString();
  const email = formatUsernameToEmail(cleanUsername);

  const profile: UserProfile = {
    uid,
    username: cleanUsername,
    email,
    createdAt: now,
    lastLoginAt: now
  };

  // Lưu tài khoản vào danh bạ người dùng
  users[normalizedKey] = {
    ...profile,
    passwordHash: btoa(password) // Mã hóa cơ bản để bảo vệ mật khẩu
  };
  persistUsersMap(users);

  // Đặt làm tài khoản đang hoạt động
  localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
  notifyAuthListeners();

  return profile;
}

// =========================================================================
// 2. ĐĂNG NHẬP TÀI KHOẢN
// =========================================================================
export async function loginWithUsername(username: string, password: string): Promise<UserProfile> {
  const cleanUsername = username.trim();
  const users = getStoredUsersMap();
  const normalizedKey = cleanUsername.toLowerCase();
  const userRecord = users[normalizedKey];

  if (!userRecord) {
    throw new Error('Không tìm thấy tài khoản này! Hãy chuyển sang mục "Đăng ký" để tạo tài khoản mới.');
  }

  // Kiểm tra mật khẩu
  if (userRecord.passwordHash !== btoa(password) && userRecord.passwordHash !== password) {
    throw new Error('Mật khẩu không chính xác! Vui lòng thử lại.');
  }

  const now = new Date().toISOString();
  userRecord.lastLoginAt = now;
  users[normalizedKey] = userRecord;
  persistUsersMap(users);

  const profile: UserProfile = {
    uid: userRecord.uid,
    username: userRecord.username,
    email: userRecord.email,
    createdAt: userRecord.createdAt,
    lastLoginAt: now
  };

  localStorage.setItem(STORAGE_ACTIVE_USER_KEY, JSON.stringify(profile));
  notifyAuthListeners();

  return profile;
}

// =========================================================================
// 3. ĐĂNG NHẬP DẠNG KHÁCH (1-CHẠM CHƠI NGAY)
// =========================================================================
export async function loginAsGuest(): Promise<UserProfile> {
  const guestCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const guestName = `Khách_${guestCode}`;
  const now = new Date().toISOString();

  const profile: UserProfile = {
    uid: `guest_${Date.now().toString(36)}`,
    username: guestName,
    email: undefined,
    createdAt: now,
    lastLoginAt: now
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
// 5. LƯU TIẾN TRÌNH THÀNH PHỐ CỦA NGƯỜI DÙNG
// =========================================================================
export async function saveCityToCloud(
  userId: string,
  cityId: string,
  saveJson: string,
  totalPassengers = 0,
  totalDays = 0
): Promise<void> {
  try {
    // Lưu độc lập cho từng người dùng
    const userSaveKey = `${STORAGE_CITY_SAVE_PREFIX}${userId}_${cityId}`;
    localStorage.setItem(userSaveKey, saveJson);

    // Lưu thêm bản sao dự phòng theo thành phố
    localStorage.setItem(`city_save_${cityId}`, saveJson);

    // Lưu metadata thống kê (ngày, khách, thời gian cập nhật)
    const meta: CloudSaveData = {
      userId,
      cityId,
      saveJson: '',
      version: 3,
      totalPassengers,
      totalDays,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`${userSaveKey}_meta`, JSON.stringify(meta));
  } catch (err) {
    console.error('Lỗi khi lưu game:', err);
    throw new Error('Bộ nhớ trình duyệt đầy, không thể lưu thêm!');
  }
}

// =========================================================================
// 6. TẢI TIẾN TRÌNH THÀNH PHỐ ĐÃ LƯU
// =========================================================================
export async function loadCityFromCloud(userId: string, cityId: string): Promise<string | null> {
  try {
    // 1. Thử tải file save của người dùng này
    const userSaveKey = `${STORAGE_CITY_SAVE_PREFIX}${userId}_${cityId}`;
    const userSave = localStorage.getItem(userSaveKey);
    if (userSave) return userSave;

    // 2. Thử tải bản sao dự phòng
    const backupSave = localStorage.getItem(`city_save_${cityId}`);
    if (backupSave) return backupSave;
  } catch (err) {
    console.warn('Lỗi khi đọc file save:', err);
  }
  return null;
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
