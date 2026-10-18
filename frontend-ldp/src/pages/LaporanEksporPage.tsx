import API from "../api";
import { useState } from "react";

const modules = [
  { value: "semua", label: "Seluruh Modul" },
  { value: "risiko", label: "Manajemen Risiko" },
  { value: "perubahan", label: "Manajemen Perubahan" },
  { value: "pengetahuan", label: "Manajemen Pengetahuan" },
  { value: "keberlangsungan", label: "Manajemen Keberlangsungan" },
  { value: "relasi-pengguna", label: "Manajemen Relasi Pengguna" },
];

export default function LaporanEksporPage() {
  const [modul, setModul] = useState("semua");
  const [jenis, setJenis] = useState("rekap");
  const [format, setFormat] = useState("pdf");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloadError("");

      const response = await API.get("/laporan-ekspor", {
        params: {
          modul,
          jenis,
          format,
        },
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type:
          format === "pdf"
            ? "application/pdf"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `laporan-sim-ldp-${modul}.${
        format === "pdf" ? "pdf" : "xlsx"
      }`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      let message = "Gagal mengunduh laporan.";

      if (error.response?.data instanceof Blob) {
        try {
          const result = JSON.parse(
            await error.response.data.text()
          );
          message = result.message || message;
        } catch {
          message = "Gagal membaca respons dari server.";
        }
      }

      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #D1D5DB",
    borderRadius: 8,
    background: "#FFFFFF",
    fontSize: 13,
    color: "#1B2A4A",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: "#4B5563",
    marginBottom: 8,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div>
        <h1
          style={{
            margin: 0,
            color: "#1B2A4A",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Laporan & Ekspor
        </h1>
        <p style={{ color: "#6B7280", fontSize: 13, marginTop: 6 }}>
          Pengelolaan laporan lima modul SIM-LDP
        </p>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D1D5DB",
          borderRadius: 10,
          padding: 24,
          maxWidth: 720,
        }}
      >
        <h2
          style={{
            margin: "0 0 20px",
            color: "#1B2A4A",
            fontSize: 16,
          }}
        >
          Pengaturan Laporan
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label htmlFor="modul" style={labelStyle}>
              Pilih Modul
            </label>
            <select
              id="modul"
              value={modul}
              onChange={(e) => setModul(e.target.value)}
              style={inputStyle}
            >
              {modules.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="jenis" style={labelStyle}>
              Jenis Laporan
            </label>
            <select
              id="jenis"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              style={inputStyle}
            >
              <option value="rekap">Rekapitulasi Data</option>
              <option value="detail">Detail Isian Formulir</option>
            </select>
          </div>

          <div>
            <label htmlFor="format" style={labelStyle}>
              Format File
            </label>
            <select
              id="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={inputStyle}
            >
              <option value="pdf">PDF</option>
              <option value="excel">Excel (.xlsx)</option>
            </select>
          </div>

          <div
            style={{
              background: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: 16,
              fontSize: 12,
              color: "#4B5563",
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: "#1B2A4A" }}>
              Ringkasan Pilihan
            </strong>
            <div>
              Modul: {modules.find((item) => item.value === modul)?.label}
            </div>
            <div>
              Jenis: {jenis === "rekap" ? "Rekapitulasi Data" : "Detail Isian Formulir"}
            </div>
            <div>
              Format: {format === "pdf" ? "PDF" : "Excel (.xlsx)"}
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            style={{
              padding: "12px 20px",
              background: downloading ? "#94A3B8" : "#1B2A4A",
              border: "none",
              borderRadius: 8,
              color: "#FFFFFF",
              fontWeight: 600,
              fontSize: 13,
              cursor: downloading ? "wait" : "pointer",
              alignSelf: "flex-start",
            }}
          >
            {downloading ? "Menyiapkan Laporan..." : "Unduh Laporan"}
          </button>

          {downloadError && (
            <p style={{ margin: 0, color: "#DC2626", fontSize: 12 }}>
              {downloadError}
            </p>
          )}

          <p style={{ margin: 0, color: "#6B7280", fontSize: 12 }}>
            Fitur unduh akan tersedia setelah layanan ekspor backend terhubung.
          </p>
        </div>
      </div>
    </div>
  );
}
