import { useEffect, useState } from "react";

import {
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  Users,
  X,
} from "lucide-react";

import API from "../api";

type Account = {
  id: number;
  nama: string;
  email: string;
  role: string;
  role_id: number;
  nama_role: string;
  nama_instansi: string | null;
  nama_unit: string | null;
  jabatan: string | null;
  upr_instansi: string | null;
  created_at: string;
};

type Role = {
  id: number;
  nama_role: string;
  deskripsi: string | null;
};

type AccountForm = {
  nama: string;
  email: string;
  password: string;
  role_id: string;
  nama_instansi: string;
  nama_unit: string;
  jabatan: string;
};

const emptyForm: AccountForm = {
  nama: "",
  email: "",
  password: "",
  role_id: "",
  nama_instansi: "",
  nama_unit: "",
  jabatan: "",
};

export default function KelolaAkunPage() {
  const [accounts, setAccounts] =
    useState<Account[]>([]);

  const [roles, setRoles] =
    useState<Role[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    resetModalOpen,
    setResetModalOpen,
  ] = useState(false);

  const [editing, setEditing] =
    useState<Account | null>(null);

  const [
    resetAccount,
    setResetAccount,
  ] = useState<Account | null>(null);

  const [form, setForm] =
    useState<AccountForm>(emptyForm);

  const [
    resetPassword,
    setResetPassword,
  ] = useState("");

  const [
    resetConfirmPassword,
    setResetConfirmPassword,
  ] = useState("");

  const inputClass =
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500";

  const labelClass =
    "text-sm font-medium text-slate-700";

  const selectedRole =
    roles.find(
      (role) =>
        String(role.id) ===
        form.role_id
    );

  const isAdminRole =
    selectedRole?.nama_role
      ?.trim()
      .toLowerCase() ===
    "admin";

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        accountResponse,
        roleResponse,
      ] = await Promise.all([
        API.get("/accounts"),
        API.get("/accounts/roles"),
      ]);

      setAccounts(
        Array.isArray(
          accountResponse.data?.data
        )
          ? accountResponse.data.data
          : []
      );

      setRoles(
        Array.isArray(
          roleResponse.data?.data
        )
          ? roleResponse.data.data
          : []
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Gagal mengambil data akun."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEdit = (
    account: Account
  ) => {
    setEditing(account);

    setForm({
      nama:
        account.nama,

      email:
        account.email,

      password:
        "",

      role_id:
        String(account.role_id),

      nama_instansi:
        account.nama_instansi ||
        account.upr_instansi ||
        "",

      nama_unit:
        account.nama_unit || "",

      jabatan:
        account.jabatan || "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSave = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.nama.trim()) {
      setError(
        "Nama wajib diisi."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Email wajib diisi."
      );
      return;
    }

    if (!form.role_id) {
      setError(
        "Role wajib dipilih."
      );
      return;
    }

    if (!isAdminRole) {
      if (
        !form.nama_instansi.trim()
      ) {
        setError(
          "Instansi wajib diisi."
        );
        return;
      }

      if (
        !form.nama_unit.trim()
      ) {
        setError(
          "Unit / Bidang wajib diisi."
        );
        return;
      }

      if (
        !form.jabatan.trim()
      ) {
        setError(
          "Jabatan wajib diisi."
        );
        return;
      }
    }

    if (
      !editing &&
      !form.password
    ) {
      setError(
        "Password wajib diisi."
      );
      return;
    }

    if (
      !editing &&
      form.password.length < 8
    ) {
      setError(
        "Password minimal 8 karakter."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        nama:
          form.nama.trim(),

        email:
          form.email.trim(),

        role_id:
          Number(form.role_id),

        nama_instansi:
          isAdminRole
            ? null
            : form.nama_instansi.trim(),

        nama_unit:
          isAdminRole
            ? null
            : form.nama_unit.trim(),

        jabatan:
          isAdminRole
            ? null
            : form.jabatan.trim(),
      };

      if (editing) {
        await API.put(
          `/accounts/${editing.id}`,
          payload
        );

        setSuccess(
          "Akun berhasil diperbarui."
        );
      } else {
        await API.post(
          "/accounts",
          {
            ...payload,
            password:
              form.password,
          }
        );

        setSuccess(
          "Akun berhasil dibuat."
        );
      }

      closeModal();
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Gagal menyimpan akun."
      );
    } finally {
      setSaving(false);
    }
  };

  const openResetPassword = (
    account: Account
  ) => {
    setResetAccount(account);
    setResetPassword("");
    setResetConfirmPassword("");
    setError("");
    setSuccess("");
    setResetModalOpen(true);
  };

  const closeResetModal = () => {
    setResetModalOpen(false);
    setResetAccount(null);
    setResetPassword("");
    setResetConfirmPassword("");
  };

  const handleResetPassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!resetAccount) {
      return;
    }

    setError("");
    setSuccess("");

    if (!resetPassword) {
      setError(
        "Password baru wajib diisi."
      );
      return;
    }

    if (
      !resetConfirmPassword
    ) {
      setError(
        "Konfirmasi password wajib diisi."
      );
      return;
    }

    if (
      resetPassword.length < 8
    ) {
      setError(
        "Password minimal 8 karakter."
      );
      return;
    }

    if (
      resetPassword !==
      resetConfirmPassword
    ) {
      setError(
        "Konfirmasi password tidak sesuai."
      );
      return;
    }

    try {
      setSaving(true);

      await API.patch(
        `/accounts/${resetAccount.id}/reset-password`,
        {
          password:
            resetPassword,

          confirmPassword:
            resetConfirmPassword,
        }
      );

      setSuccess(
        `Password ${resetAccount.nama} berhasil direset.`
      );

      closeResetModal();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Gagal mereset password."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (
    value: string
  ) => {
    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Kelola Akun
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Pengelolaan akun dan role pengguna SIM-LDP
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Perbarui
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            <Plus size={15} />
            Tambah Akun
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Daftar Akun
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {accounts.length} akun terdaftar
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
            <Users
              size={19}
              className="text-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                  Nama
                </th>

                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  Email
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                  Role
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                  Instansi
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                  Unit / Bidang
                </th>

                <th className="px-4 py-3 text-xs font-semibold text-slate-600">
                  Jabatan
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                  Dibuat
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Memuat akun...
                  </td>
                </tr>
              ) : accounts.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Belum ada akun.
                  </td>
                </tr>
              ) : (
                accounts.map(
                  (account) => (
                    <tr
                      key={
                        account.id
                      }
                      className="border-b border-slate-100 last:border-b-0"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">
                        {
                          account.nama
                        }
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {
                          account.email
                        }
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {account.nama_role ||
                            account.role}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {account.nama_instansi ||
                          account.upr_instansi ||
                          "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {account.nama_unit ||
                          "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {account.jabatan ||
                          "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(
                          account.created_at
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                account
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openResetPassword(
                                account
                              )
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                          >
                            <KeyRound size={13} />
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editing
                    ? "Edit Akun"
                    : "Tambah Akun"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editing
                    ? "Perbarui data dan role pengguna."
                    : "Buat akun pengguna baru SIM-LDP."}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={
                handleSave
              }
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Nama{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      form.nama
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nama:
                          e.target.value,
                      })
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Email{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email:
                          e.target.value,
                      })
                    }
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                {!editing && (
                  <div>
                    <label className={labelClass}>
                      Password{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      type="password"
                      value={
                        form.password
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password:
                            e.target.value,
                        })
                      }
                      minLength={8}
                      required
                      className={
                        inputClass
                      }
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Minimal 8 karakter.
                    </p>
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Role{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      form.role_id
                    }
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      const selected =
                        roles.find(
                          (role) =>
                            String(
                              role.id
                            ) ===
                            value
                        );

                      const adminSelected =
                        selected?.nama_role
                          ?.trim()
                          .toLowerCase() ===
                        "admin";

                      setForm({
                        ...form,

                        role_id:
                          value,

                        nama_instansi:
                          adminSelected
                            ? ""
                            : form.nama_instansi,

                        nama_unit:
                          adminSelected
                            ? ""
                            : form.nama_unit,

                        jabatan:
                          adminSelected
                            ? ""
                            : form.jabatan,
                      });
                    }}
                    required
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Pilih role
                    </option>

                    {roles.map(
                      (role) => (
                        <option
                          key={
                            role.id
                          }
                          value={
                            role.id
                          }
                        >
                          {
                            role.nama_role
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {!isAdminRole && (
                  <>
                    <div>
                      <label className={labelClass}>
                        Instansi{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={
                          form.nama_instansi
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            nama_instansi:
                              e.target.value,
                          })
                        }
                        placeholder="Contoh: Dinas Komunikasi dan Informatika"
                        required
                        className={
                          inputClass
                        }
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Unit / Bidang{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={
                          form.nama_unit
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            nama_unit:
                              e.target.value,
                          })
                        }
                        placeholder="Contoh: Bidang Aplikasi dan Informatika"
                        required
                        className={
                          inputClass
                        }
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className={labelClass}>
                        Jabatan{" "}
                        <span className="text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        value={
                          form.jabatan
                        }
                        onChange={(e) =>
                          setForm({
                            ...form,
                            jabatan:
                              e.target.value,
                          })
                        }
                        placeholder="Contoh: Kepala Bidang Aplikasi dan Informatika"
                        required
                        className={
                          inputClass
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetModalOpen &&
        resetAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Reset Password
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      resetAccount.nama
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeResetModal
                  }
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={
                  handleResetPassword
                }
                className="p-6"
              >
                <div>
                  <label className={labelClass}>
                    Password Baru{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="password"
                    value={
                      resetPassword
                    }
                    onChange={(e) =>
                      setResetPassword(
                        e.target.value
                      )
                    }
                    minLength={8}
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div className="mt-4">
                  <label className={labelClass}>
                    Konfirmasi Password{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="password"
                    value={
                      resetConfirmPassword
                    }
                    onChange={(e) =>
                      setResetConfirmPassword(
                        e.target.value
                      )
                    }
                    minLength={8}
                    required
                    className={
                      inputClass
                    }
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={
                      closeResetModal
                    }
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                  >
                    {saving
                      ? "Menyimpan..."
                      : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}