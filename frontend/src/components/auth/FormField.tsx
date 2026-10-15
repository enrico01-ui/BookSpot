import { useId, type ComponentProps, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  error?: string;
  hint?: string;
  /** Elemen di sisi kanan label, misalnya tautan "Lupa password?". */
  labelAside?: ReactNode;
}

export default function FormField({
  label,
  error,
  hint,
  labelAside,
  className,
  ...inputProps
}: FormFieldProps) {
  const id = useId();
  const messageId = `${id}-message`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className="text-gray-700">
          {label}
        </Label>
        {labelAside}
      </div>

      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? messageId : undefined}
        className={`h-12 rounded-xl border border-primary bg-white px-4 text-base transition-shadow ${className ?? ""}`}
        {...inputProps}
      />

      {error ? (
        <p
          id={messageId}
          role="alert"
          className="animate-in fade-in slide-in-from-top-1 text-sm text-danger duration-200 motion-reduce:animate-none"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-sm text-gray-600">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
