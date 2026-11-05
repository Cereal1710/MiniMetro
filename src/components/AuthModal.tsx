import React, { useState } from 'react';
import { X, Lock, User, Sparkles, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { loginWithUsername, registerWithUsername, loginAsGuest, UserProfile } from '../services/authStorage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: UserProfile) => void;
  lang?: 'vi' | 'en';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang = 'vi'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError(lang === 'vi' ? 'Vui lòng nhập tên người dùng' : 'Please enter your username');
      return;
    }
    if (password.length < 6) {
      setError(lang === 'vi' ? 'Mật khẩu phải từ 6 ký tự trở lên' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      let profile: UserProfile;
      if (mode === 'register') {
        profile = await registerWithUsername(cleanUsername, password);
      } else {
        profile = await loginWithUsername(cleanUsername, password);
      }
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await loginAsGuest();
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.warn('Guest login fallback to offline profile:', err);
      const localGuest: UserProfile = {
        uid: 'local_' + Math.random().toString(36).slice(2, 8),
        username: lang === 'vi' ? `Khách_${Math.floor(1000 + Math.random() * 9000)}` : `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      localStorage.setItem('metro_user_profile', JSON.stringify(localGuest));
      onSuccess(localGuest);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-sm max-h-[90dvh] overflow-hidden flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 relative"
        role="dialog"
      >
        {/* Glow - clipped strictly inside card */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="p-5 sm:p-6 overflow-y-auto overflow-x-hidden relative z-10 scrollbar-thin">

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">
                  {mode === 'login'
                    ? (lang === 'vi' ? 'Đăng nhập Tài khoản' : 'Account Login')
                    : (lang === 'vi' ? 'Đăng ký Tài khoản Mới' : 'Create New Account')}
                </h2>
                <p className="text-[10px] text-cyan-400/80 font-mono">
                  {lang === 'vi' ? 'Đồng bộ & Lưu trữ trên Server' : 'Server Storage & Sync'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab switch */}
          <div className="grid grid-cols-2 gap-1 p-1 my-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${mode === 'login'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Đăng nhập' : 'Login'}</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${mode === 'register'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Đăng ký' : 'Sign Up'}</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'vi' ? 'Tên đăng nhập (Username)' : 'Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập tên đăng nhập...' : 'Enter username...'}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {lang === 'vi' ? 'Mật khẩu' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={lang === 'vi' ? 'Tối thiểu 6 ký tự...' : 'Min 6 characters...'}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white shadow-lg shadow-cyan-950/40 transition cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <span className="animate-pulse">{lang === 'vi' ? 'Đang xử lý...' : 'Processing...'}</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{lang === 'vi' ? 'Đăng nhập' : 'Log In'}</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'vi' ? 'Tạo tài khoản' : 'Create Account'}</span>
                </>
              )}
            </button>

            {/* Quick 1-Click Guest Option */}
            <div className="relative my-3 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-2 bg-slate-900 text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {lang === 'vi' ? 'Hoặc' : 'Or'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'vi' ? 'Chơi ngay với tư cách Khách (Không cần mật khẩu)' : 'Play as Guest (Instant Access)'}</span>
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center text-[10px] text-slate-400">
            {lang === 'vi'
              ? 'Dữ liệu tài khoản & màn chơi được lưu trữ trên Server'
              : 'Account & game save data securely stored on the server'}
          </div>
        </div>
      </div>
    </div>
  );
};
