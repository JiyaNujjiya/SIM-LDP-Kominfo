import { useState } from 'react';
import API from './api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset error
    setError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    // Validasi email
    if (!email.trim()) {
      setEmailError('Email wajib diisi.');
      hasError = true;
    }

    // Validasi password
    if (!password.trim()) {
      setPasswordError('Password wajib diisi.');
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);

      const res = await API.post('/auth/login', {
        email,
        password,
      });

      // Simpan token
      localStorage.setItem('token', res.data.token);

      // Simpan user
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }

      // Login berhasil
      onLoginSuccess(res.data.user);
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Email atau password yang Anda masukkan salah.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between p-10"
      style={{
        background:
          'linear-gradient(0deg, rgba(27,42,74,0.04), rgba(27,42,74,0.04)), #F4F6FA',
      }}
    >
      {/* LOGIN CARD */}
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-[0px_16px_32px_rgba(27,42,74,0.10),0px_4px_16px_rgba(27,42,74,0.07)] p-10 mt-10">
        
        {/* BRAND HEADER */}
        <div className="flex flex-col items-center gap-4 mb-8">
          
          {/* Logo */}
          <img
            src="/logo_new.png"
            alt="Logo"
            className="w-36 h-12 object-contain"
          />

          {/* Brand Titles */}
          <div className="flex flex-col items-center gap-2 w-full">
            <h1 className="w-full text-center text-[18px] leading-[26px] font-bold text-[#1B2A4A]">
              Sistem Informasi Monitoring
              <br />
              Layanan Digital Pemerintah
            </h1>

            <p className="w-full text-center text-[13px] leading-5 font-normal text-[#4B5563]">
              Silakan masuk untuk melanjutkan ke sistem
            </p>
          </div>
        </div>

        {/* ERROR LOGIN */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* LOGIN FORM */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >

          {/* EMAIL */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[13px] leading-4 font-semibold text-[#4B5B84]"
            >
              Email
            </label>

            <div
              className={`box-border flex items-center gap-2 h-[42px] px-3 bg-[#F9FAFB] rounded-lg border ${
                emailError
                  ? 'border-red-400'
                  : 'border-[#D1D5DB]'
              }`}
            >
              {/* User Icon */}
              <div className="w-[18px] h-[18px] flex items-center justify-center text-[#9CA3AF]">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
              </div>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                  setError('');
                }}
                placeholder="Masukkan email"
                className="flex-1 bg-transparent outline-none text-sm text-[#1B2A4A] placeholder:text-[#4B5563]"
              />
            </div>

            {emailError && (
              <span className="text-xs text-red-500">
                {emailError}
              </span>
            )}
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[13px] leading-4 font-semibold text-[#4B5B84]"
            >
              Password
            </label>

            <div
              className={`box-border flex items-center justify-between h-[42px] px-3 bg-[#F9FAFB] rounded-lg border ${
                passwordError
                  ? 'border-red-400'
                  : 'border-[#D1D5DB]'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                {/* Lock Icon */}
                <div className="w-[18px] h-[18px] flex items-center justify-center text-[#9CA3AF]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect
                      x="4"
                      y="10"
                      width="16"
                      height="10"
                      rx="2"
                    />
                    <path d="M8 10V7a4 4 0 018 0v3" />
                  </svg>
                </div>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                    setError('');
                  }}
                  placeholder="Masukkan password"
                  className="flex-1 bg-transparent outline-none text-sm text-[#1B2A4A] placeholder:text-[#4B5563]"
                />
              </div>

              {/* SHOW PASSWORD */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[12px] font-semibold text-[#1B2A4A] hover:opacity-70"
              >
                {showPassword ? 'Sembunyikan' : 'Lihat'}
              </button>
            </div>

            {passwordError && (
              <span className="text-xs text-red-500">
                {passwordError}
              </span>
            )}
          </div>

          {/* REMEMBER ME */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-[18px] h-[18px] accent-[#1B2A4A]"
              />

              <span className="text-[13px] leading-4 text-[#4B5563]">
                Ingat saya
              </span>
            </label>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] flex items-center justify-center rounded-lg bg-[#1B2A4A] text-white text-[15px] font-semibold transition hover:bg-[#263A62] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Memproses...' : 'Masuk Aplikasi'}
          </button>

          {/* FORGOT PASSWORD */}
          <div className="flex justify-center">
            <button
              type="button"
              className="text-[13px] leading-4 font-semibold text-[#1B2A4A] underline hover:opacity-70"
            >
              Lupa password?
            </button>
          </div>
        </form>
      </div>

      {/* FOOTER */}
      <div className="flex flex-col items-center gap-2 mb-1">
        <p className="text-[12px] leading-[15px] text-[#4B5B84]">
          © 2026 Sistem LDP Pemerintah
        </p>

        <p className="text-[11px] leading-[13px] text-[#9CA3AF]">
          Sistem informasi untuk mendukung monitoring layanan digital pemerintah
        </p>
      </div>
    </div>
  );
}