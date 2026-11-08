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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = { email?: string; password?: string };

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Halaman asal yang disimpan ProtectedRoute lewat <Navigate state={{ from }} />.
  // Nilainya divalidasi di resolvePostLoginPath sebelum dipakai.
  const from: unknown = (location.state as { from?: unknown } | null)?.from;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Ref menutup celah double-submit yang terjadi sebelum state sempat ter-render.
  const submittingRef = useRef(false);

  // Pengguna yang sudah login tidak perlu melihat halaman login.
  if (user && !isSubmitting) {
    return <Navigate to={resolvePostLoginPath(from, user.role)} replace />;
  }

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submittingRef.current) return;

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const errors: FieldErrors = {};
    if (!email) errors.email = "Email wajib diisi.";
    else if (!EMAIL_PATTERN.test(email)) errors.email = "Format email tidak valid.";
    if (!password) errors.password = "Password wajib diisi.";

    setFormError(null);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const loggedInUser = await login({ email, password });
      toast.success(`Selamat datang, ${loggedInUser.name}`);
      navigate(resolvePostLoginPath(from, loggedInUser.role), { replace: true });
      // isSubmitting sengaja tidak di-reset, halaman ini akan ditinggalkan.
    } catch (error) {
      setFormError(getAuthError(error, "login").message);
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      headline={
        <>
          Lapangan favoritmu, <span className="text-accent">sekali klik.</span>
        </>
      }
      points={[
        "Pesan lapangan favoritmu dengan mudah dan cepat.",
        "Slot ditahan 15 menit saat kamu bayar.",
        "Semua booking dalam satu tempat.",
      ]}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Selamat datang kembali
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Masuk untuk melihat dan mengelola booking lapangan favoritmu.
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
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="minimal 8 karakter"
            error={fieldErrors.password}
            onChange={() => clearFieldError("password")}
            labelAside={
              <Link
                to="/lupa-password"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Lupa password?
              </Link>
            }
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-primary text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg motion-reduce:transform-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Memproses…
              </>
            ) : (
              "Login"
            )}
          </Button>
        </fieldset>
      </form>

      <div
        role="separator"
        className="my-6 flex items-center gap-3 text-sm text-gray-600"
      >
        <span className="h-px flex-1 bg-line" />
        atau
        <span className="h-px flex-1 bg-line" />
      </div>

      <Link
        to="/venues"
        className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary bg-white text-base font-bold text-primary transition-colors hover:bg-primary/5"
      >
        Jelajahi venue tanpa masuk
      </Link>

      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{" "}
        <Link
          to="/register"
          state={location.state}
          className="font-bold text-primary hover:underline"
        >
          Daftar
        </Link>
      </p>
    </AuthShell>
  );
}
