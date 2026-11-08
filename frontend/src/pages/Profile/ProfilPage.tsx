import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import FormField from "@/components/auth/FormField";
import { getAuthError } from "@/lib/api-error";
import type { AuthUser, UserRole } from "@/types/auth";

/* ---------- Konstanta, validasi, dan helper ---------- */

const ROLE_LABEL: Record<UserRole, string> = {
  CUSTOMER: "Customer",
  OWNER: "Owner",
  ADMIN: "Admin",
};

const PRIMARY_BUTTON =
  "h-12 rounded-xl bg-primary px-6 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg motion-reduce:transform-none";
const OUTLINE_BUTTON =
  "h-12 rounded-xl border-primary px-6 text-base font-bold text-primary hover:bg-primary/5";

const PHONE_PATTERN = /^(\+?62|0)8\d{7,12}$/;
const normalizePhone = (value: string) => value.replace(/[\s-]/g, "");

const validateName = (value: string) =>
  value.trim().length < 2 ? "Nama lengkap wajib diisi." : undefined;

const validatePhone = (value: string) => {
  const phone = normalizePhone(value);
  return phone && !PHONE_PATTERN.test(phone)
    ? "Nomor telepon tidak valid. Contoh: 081234567890."
    : undefined;
};

const validatePassword = (value: string) => {
  if (value.length < 8) return "Password minimal 8 karakter.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Password harus mengandung huruf dan angka.";
  }
  return undefined;
};

const hasErrors = (errors: Record<string, string | undefined>) =>
  Object.values(errors).some(Boolean);

const getInitials = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/);
  const last = rest[rest.length - 1];
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "U";
};

/** Menjalankan aksi async satu per satu; ref menutup celah dua klik cepat sebelum state ter-render. */
function useSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const locked = useRef(false);

  const run = async (task: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setIsSubmitting(true);
    try {
      await task();
    } finally {
      locked.current = false;
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, run };
}

/* ---------- Bagian kecil yang dipakai berulang di file ini ---------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="gap-5 rounded-2xl bg-white shadow-sm [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-ink">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Alert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="animate-in fade-in slide-in-from-top-1 rounded-xl bg-cancelled-bg px-4 py-3 text-sm font-medium text-cancelled-fg duration-200 motion-reduce:animate-none"
    >
      {message}
    </div>
  );
}

/* ---------- Form data diri ---------- */

type DetailsValues = { name: string; phone: string };
type DetailsErrors = Partial<Record<keyof DetailsValues, string>>;

function DetailsForm({ user }: { user: AuthUser }) {
  const { updateProfile } = useAuth();
  const initial: DetailsValues = { name: user.name, phone: user.phone ?? "" };

  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { isSubmitting, run } = useSubmit();

  const isDirty =
    values.name.trim() !== initial.name ||
    normalizePhone(values.phone) !== normalizePhone(initial.phone);

  const setField =
    (field: keyof DetailsValues) => (e: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const reset = () => {
    setValues(initial);
    setErrors({});
    setFormError(null);
  };

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: DetailsErrors = {
      name: validateName(values.name),
      phone: validatePhone(values.phone),
    };
    setFormError(null);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    const input = {
      name: values.name.trim(),
      phone: normalizePhone(values.phone) || null,
      
    };

    void run(async () => {
      try {
        await updateProfile(input);
        setValues({ name: input.name, phone: input.phone ?? "" });
        toast.success("Profil berhasil diperbarui.");
      } catch (error) {
        setFormError(getAuthError(error, "profile").message);
      }
    });
  };

  return (
    <Section title="Data diri">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
        className="flex flex-col gap-5"
      >
        <Alert message={formError} />

        <fieldset
          disabled={isSubmitting}
          className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0"
        >
          <FormField
            label="Nama lengkap"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={setField("name")}
            error={errors.name}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={user.email}
            readOnly
            disabled
            hint="Email tidak dapat diubah."
          />
          <FormField
            label="Nomor telepon (opsional)"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx xxxx xxxx"
            value={values.phone}
            onChange={setField("phone")}
            error={errors.phone}
          />

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className={PRIMARY_BUTTON}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Menyimpan…
                </>
              ) : (
                "Simpan perubahan"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty}
              onClick={reset}
              className={OUTLINE_BUTTON}
            >
              Batal
            </Button>
          </div>
        </fieldset>
      </form>
    </Section>
  );
}

/* ---------- Form ganti password ---------- */

type PasswordField = "currentPassword" | "newPassword";

function PasswordForm() {
  const { changePassword } = useAuth();
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const { isSubmitting, run } = useSubmit();

  const clearError = (field: PasswordField) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");

    const nextErrors = {
      currentPassword: currentPassword ? undefined : "Password saat ini wajib diisi.",
      newPassword:
        validatePassword(newPassword) ??
        (newPassword === currentPassword
          ? "Password baru harus berbeda dari password saat ini."
          : undefined),
    };
    setFormError(null);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    void run(async () => {
      try {
        await changePassword({ currentPassword, newPassword });
        form.reset();
        toast.success("Password berhasil diperbarui.");
      } catch (error) {
        setFormError(getAuthError(error, "password").message);
      }
    });
  };

  return (
    <Section
      title="Ganti password"
      description="Gunakan password yang kuat dan belum dipakai di tempat lain."
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isSubmitting}
        className="flex flex-col gap-5"
      >
        <Alert message={formError} />

        <fieldset
          disabled={isSubmitting}
          className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0"
        >
          <FormField
            label="Password saat ini"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword}
            onChange={() => clearError("currentPassword")}
          />
          <FormField
            label="Password baru"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="minimal 8 karakter"
            hint="Gunakan kombinasi huruf dan angka."
            error={errors.newPassword}
            onChange={() => clearError("newPassword")}
          />

          <div>
            <Button type="submit" disabled={isSubmitting} className={PRIMARY_BUTTON}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Memperbarui…
                </>
              ) : (
                "Perbarui password"
              )}
            </Button>
          </div>
        </fieldset>
      </form>
    </Section>
  );
}

/* ---------- Halaman ---------- */

export default function ProfilPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isSubmitting: isLoggingOut, run } = useSubmit();

  // ProtectedRoute menjamin user ada; guard ini hanya untuk type narrowing.
  if (!user) return null;

  const isActive = user.status.toUpperCase() === "ACTIVE";

  const handleLogout = () =>
    run(async () => {
      // Sesi lokal tetap dibersihkan AuthContext walau request logout gagal.
      await logout().catch(() => undefined);
      navigate("/login", { replace: true });
    });

  return (
    <div className="min-h-screen bg-canvas pb-12">
      <header className="bg-ink px-4 pb-24 pt-10 text-white sm:px-8 lg:px-12">
        <div className="animate-in fade-in slide-in-from-bottom-2 mx-auto flex max-w-5xl flex-col items-center gap-4 text-center duration-500 motion-reduce:animate-none sm:flex-row sm:gap-5 sm:text-left">
          <Avatar className="size-20 shrink-0 ring-4 ring-white/10">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={`Foto profil ${user.name}`} />
            )}
            <AvatarFallback className="bg-accent text-2xl font-extrabold text-ink">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">
              {user.name}
            </h1>
            <p className="mt-1 truncate text-on-dark">{user.email}</p>
            <span className="mt-3 inline-block rounded-full bg-confirmed-bg px-3 py-1 text-xs font-bold text-confirmed-fg">
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        </div>
      </header>

      <div className="relative mx-auto -mt-14 grid max-w-5xl gap-6 px-4 sm:px-8 lg:grid-cols-[2fr_1fr] lg:items-start lg:px-12">
        <div className="flex flex-col gap-6">
          <DetailsForm key={user.id} user={user} />
          <PasswordForm />
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Ringkasan akun">
            <dl className="divide-y divide-line text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-600">Peran</dt>
                <dd className="font-bold text-ink">{ROLE_LABEL[user.role]}</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-gray-600">Status</dt>
                <dd
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    isActive
                      ? "bg-confirmed-bg text-confirmed-fg"
                      : "bg-expired-bg text-expired-fg"
                  }`}
                >
                  {isActive ? "Aktif" : user.status}
                </dd>
              </div>
            </dl>
          </Section>

          <Section title="Sesi" description="Keluar dari akun ini di perangkat ini.">
            <Button
              variant="outline"
              disabled={isLoggingOut}
              onClick={() => void handleLogout()}
              className={`${OUTLINE_BUTTON} w-full`}
            >
              {isLoggingOut ? (
                <Loader2 className="size-5 animate-spin" aria-hidden />
              ) : (
                <LogOut className="size-5" aria-hidden />
              )}
              Keluar
            </Button>
          </Section>
        </div>
      </div>
    </div>
  );
}