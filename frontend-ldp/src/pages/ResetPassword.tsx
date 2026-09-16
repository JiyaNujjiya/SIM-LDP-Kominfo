import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Token reset password tidak ditemukan.");
      return;
    }

    if (!password.trim()) {
      setError("Password baru wajib diisi.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (!confirmPassword.trim()) {
      setError("Konfirmasi password wajib diisi.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });

      setSuccess(res.data.message);
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Terjadi kesalahan saat mengubah password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between p-10"
      style={{
        background:
          "linear-gradient(0deg, rgba(27,42,74,0.04), rgba(27,42,74,0.04)), #F4F6FA",
      }}
    >
      <div className="w-full max-w-[480px] bg-white rounded-xl shadow-[0px_16px_32px_rgba(27,42,74,0.10),0px_4px_16px_rgba(27,42,74,0.07)] p-10 mt-10">
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src="/logo_new.png"
            alt="Logo"
            className="w-36 h-12 object-contain"
          />

          <div className="flex flex-col items-center gap-2 w-full">
            <h1 className="w-full text-center text-[18px] leading-[26px] font-bold text-[#1B2A4A]">
              Reset Password
            </h1>

            <p className="w-full text-center text-[13px] leading-5 text-[#4B5563]">
              Buat password baru untuk akun Anda
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[13px] leading-4 font-semibold text-[#4B5B84]"
            >
              Password Baru
            </label>

            <div className="box-border flex items-center justify-between h-[42px] px-3 bg-[#F9FAFB] rounded-lg border border-[#D1D5DB]">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Masukkan password baru"
                className="flex-1 bg-transparent outline-none text-sm text-[#1B2A4A] placeholder:text-[#4B5563]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[12px] font-semibold text-[#1B2A4A] hover:opacity-70"
              >
                {showPassword ? "Sembunyikan" : "Lihat"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-[13px] leading-4 font-semibold text-[#4B5B84]"
            >
              Konfirmasi Password
            </label>

            <div className="box-border flex items-center justify-between h-[42px] px-3 bg-[#F9FAFB] rounded-lg border border-[#D1D5DB]">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Ulangi password baru"
                className="flex-1 bg-transparent outline-none text-sm text-[#1B2A4A] placeholder:text-[#4B5563]"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="text-[12px] font-semibold text-[#1B2A4A] hover:opacity-70"
              >
                {showConfirmPassword ? "Sembunyikan" : "Lihat"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full h-[46px] flex items-center justify-center rounded-lg bg-[#1B2A4A] text-white text-[15px] font-semibold transition hover:bg-[#263A62] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Memproses..."
              : "Simpan Password Baru"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-[13px] leading-4 font-semibold text-[#1B2A4A] underline hover:opacity-70"
          >
            Kembali ke Login
          </button>
        </form>
      </div>

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