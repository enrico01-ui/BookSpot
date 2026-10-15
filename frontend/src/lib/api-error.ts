import axios from "axios";

type ErrorContext = "login" | "register" | "profile" | "password";

export interface FriendlyError {
  message: string;
  /** Field yang bermasalah, jika bisa ditentukan dengan pasti dari status HTTP. */
  field?: "email";
}

const GENERIC = "Terjadi kesalahan. Coba lagi.";
const INVALID_DATA = "Data yang kamu isi belum valid. Periksa kembali.";

const STATUS_MESSAGES: Record<number, string> = {
  400: INVALID_DATA,
  422: INVALID_DATA,
  401: "Sesi kamu berakhir. Silakan masuk lagi.",
  403: "Kamu tidak memiliki akses untuk tindakan ini.",
  404: "Layanan tidak ditemukan. Coba lagi nanti.",
  409: "Terjadi konflik data. Coba lagi.",
  429: "Terlalu banyak percobaan. Tunggu beberapa saat lalu coba lagi.",
};

// Pesan khusus per konteks; menimpa STATUS_MESSAGES.
const CONTEXT_MESSAGES: Partial<
  Record<ErrorContext, Partial<Record<number, string>>>
> = {
  login: {
    401: "Email atau password salah.",
    403: "Akun kamu tidak dapat digunakan. Hubungi admin.",
  },
  register: { 409: "Email sudah terdaftar. Coba masuk." },
  password: { 401: "Password saat ini salah.", 403: "Password saat ini salah." },
};

/**
 * Menerjemahkan error API menjadi pesan aman untuk pengguna.
 * Pesan mentah dari server TIDAK pernah ditampilkan; hanya status HTTP
 * dan jenis error jaringan yang dipakai.
 */
export function getAuthError(error: unknown, context: ErrorContext): FriendlyError {
  if (!axios.isAxiosError(error)) return { message: GENERIC };

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return { message: "Server terlalu lama merespons. Coba lagi sebentar lagi." };
  }
  if (!error.response) {
    return { message: "Tidak dapat terhubung ke server. Periksa koneksi internetmu." };
  }

  const { status } = error.response;
  const message =
    CONTEXT_MESSAGES[context]?.[status] ??
    STATUS_MESSAGES[status] ??
    (status >= 500 ? "Server sedang bermasalah. Coba lagi nanti." : GENERIC);

  return context === "register" && status === 409
    ? { message, field: "email" }
    : { message };
}