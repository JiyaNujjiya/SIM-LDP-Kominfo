import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setResetUrl("");

    if (!email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/forgot-password", {
        email,
      });

      setSuccess(res.data.message);
      setResetUrl(res.data.resetUrl || "");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Terjadi kesalahan. Silakan coba lagi."
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
              Lupa Password
            </h1>

            <p className="w-full text-center text-[13px] leading-5 text-[#4B5563]">
              Masukkan email akun Anda untuk melakukan reset password
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

        {resetUrl && (
          <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-4">
            <p className="mb-3 text-[13px] leading-5 text-blue-700">
              Email berhasil diverifikasi. Silakan lanjutkan untuk membuat
              password baru.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.href = resetUrl;
              }}
              className="w-full h-[42px] flex items-center justify-center rounded-lg bg-blue-600 text-white text-[13px] font-semibold hover:bg-blue-700"
            >
              Lanjut Reset Password
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[13px] leading-4 font-semibold text-[#4B5B84]"
            >
              Email
            </label>

            <div className="box-border flex items-center gap-2 h-[42px] px-3 bg-[#F9FAFB] rounded-lg border border-[#D1D5DB]">
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
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </div>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                  setSuccess("");
                  setResetUrl("");
                }}
                placeholder="Masukkan email"
                className="flex-1 bg-transparent outline-none text-sm text-[#1B2A4A] placeholder:text-[#4B5563]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] flex items-center justify-center rounded-lg bg-[#1B2A4A] text-white text-[15px] font-semibold transition hover:bg-[#263A62] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Verifikasi Email"}
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