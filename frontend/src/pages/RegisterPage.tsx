import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
import FormField from "@/components/auth/FormField";
import { getAuthError } from "@/lib/api-error";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import type { UserRole } from "@/types/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN = /^(\+?62|0)8\d{7,12}$/;

// Hanya dua role yang boleh dipilih dari form. ADMIN tidak pernah tersedia di sini.
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "CUSTOMER", label: "Booking lapangan" },
  { value: "OWNER", label: "Kelola venue" },
];

type Field = "name" | "email" | "phone" | "password";
type FieldErrors = Partial<Record<Field, string>>;

function validate(values: Record<Field, string>): FieldErrors {
  const errors: FieldErrors = {};

  if (values.name.length < 2) errors.name = "Nama lengkap wajib diisi.";

  if (!values.email) errors.email = "Email wajib diisi.";
  else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "Format email tidak valid.";
  }

  if (values.phone && !PHONE_PATTERN.test(values.phone)) {
    errors.phone = "Nomor telepon tidak valid. Contoh: 081234567890.";
  }

  if (values.password.length < 8) {
    errors.password = "Password minimal 8 karakter.";
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = "Password harus mengandung huruf dan angka.";
  }

  return errors;
}

export default function RegisterPage() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from: unknown = (location.state as { from?: unknown } | null)?.from;

  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const submittingRef = useRef(false);

  // Pengguna yang sudah login tidak perlu mendaftar lagi.
  if (user) {
    return <Navigate to={resolvePostLoginPath(from, user.role)} replace />;
  }

  const clearFieldError = (field: Field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const formData = new FormData(e.currentTarget);
    const values: Record<Field, string> = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").replace(/[\s-]/g, ""),
      password: String(formData.get("password") ?? ""),
    };

    const errors = validate(values);
    setFormError(null);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone || undefined,
        role,
      });
      toast.success("Akun berhasil dibuat. Silakan masuk.");
      // Teruskan `from` supaya tujuan awal tidak hilang setelah login.
      navigate("/login", { replace: true, state: location.state });
    } catch (error) {
      const { message, field } = getAuthError(error, "register");
      if (field) setFieldErrors({ [field]: message });
      else setFormError(message);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      numbered
      headline={
        <>
          Satu akun, <span className="text-accent">semua lapangan.</span>
        </>
      }
      points={[
        "Daftar dalam satu menit.",
        "Pilih lapangan, jam, dan bayar.",
        "Datang dan main.",
      ]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Buat akun baru
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Gratis dan hanya butuh beberapa detik.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
        className="flex flex-col gap-5"
      >
        {formError && (
          <div
            role="alert"
            className="animate-in fade-in slide-in-from-top-1 rounded-xl bg-cancelled-bg px-4 py-3 text-sm font-medium text-cancelled-fg duration-200 motion-reduce:animate-none"
          >
            {formError}
          </div>
        )}

        <fieldset
          disabled={isSubmitting}
          className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0"
        >
          <div className="flex flex-col gap-1.5">
            <span id="role-label" className="text-sm font-medium text-gray-700">
              Saya ingin
            </span>
            <div
              role="radiogroup"
              aria-labelledby="role-label"
              className="flex flex-wrap gap-3"
            >
              {ROLE_OPTIONS.map((option) => {
                const selected = role === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setRole(option.value)}
                    className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 motion-reduce:transition-none ${
                      selected
                        ? "border-ink bg-ink text-white"
                        : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {role === "OWNER" && (
              <p className="animate-in fade-in slide-in-from-top-1 text-sm text-gray-600 duration-200 motion-reduce:animate-none">
                Venue baru perlu disetujui Admin sebelum tampil.
              </p>
            )}
          </div>

          <FormField
            label="Nama lengkap"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Nama kamu"
            error={fieldErrors.name}
            onChange={() => clearFieldError("name")}
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="nama@email.com"
            error={fieldErrors.email}
            onChange={() => clearFieldError("email")}
          />

          <FormField
            label="Nomor telepon (opsional)"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="08xx xxxx xxxx"
            error={fieldErrors.phone}
            onChange={() => clearFieldError("phone")}
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="minimal 8 karakter"
            hint="Gunakan kombinasi huruf dan angka."
            error={fieldErrors.password}
            onChange={() => clearFieldError("password")}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg motion-reduce:transform-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Membuat akun…
              </>
            ) : (
              "Buat akun"
            )}
          </Button>
        </fieldset>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Sudah punya akun?{" "}
        <Link
          to="/login"
          state={location.state}
          className="font-bold text-primary hover:underline"
        >
          Masuk
        </Link>
      </p>
    </AuthShell>
  );
}
