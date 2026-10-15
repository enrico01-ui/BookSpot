import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

interface AuthShellProps {
  headline: ReactNode;
  points: string[];
  /** true: poin diberi nomor 1, 2, 3. false: diberi tanda centang. */
  numbered?: boolean;
  children: ReactNode;
}

function Logomark({ tone }: { tone: "dark" | "light" }) {
  const bg = tone === "dark" ? "bg-accent" : "bg-primary";
  const line = tone === "dark" ? "border-ink" : "border-white";

  return (
    <span
      aria-hidden
      className={`relative inline-block size-7 shrink-0 rounded-lg ${bg}`}
    >
      <span className={`absolute inset-1.5 rounded-[3px] border-2 ${line}`} />
      <span className={`absolute inset-y-1.5 left-1/2 border-l-2 ${line}`} />
    </span>
  );
}


export default function AuthShell({
  headline,
  points,
  numbered = false,
  children,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between gap-10 bg-ink px-12 py-14 text-white lg:flex xl:px-16">
        <Link
          to="/"
          className="flex w-fit items-center gap-2.5 text-2xl font-extrabold tracking-tight"
        >
          <Logomark tone="dark" />
          BookSpot
        </Link>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 motion-reduce:animate-none">
          <h2 className="max-w-lg text-4xl font-extrabold leading-[1.08] tracking-tight xl:text-5xl">
            {headline}
          </h2>

          <ul className="mt-8 flex flex-col gap-4">
            {points.map((text, i) => (
              <li
                key={text}
                className="animate-in fade-in slide-in-from-left-4 flex items-center gap-4 duration-500 motion-reduce:animate-none"
                style={{
                  animationDelay: `${200 + i * 120}ms`,
                  animationFillMode: "both",
                }}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent font-extrabold text-ink">
                  {numbered ? i + 1 : <Check className="size-5" aria-hidden />}
                </span>
                <span className="text-lg">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-on-dark">
          Data kamu hanya dipakai untuk booking dan notifikasi.
        </p>
      </aside>

      <main className="flex flex-col bg-canvas px-6 py-8 sm:px-12 lg:justify-center lg:px-16">
        <Link
          to="/"
          className="mb-10 flex w-fit items-center gap-2.5 text-xl font-extrabold tracking-tight text-ink lg:hidden"
        >
          <Logomark tone="light" />
          BookSpot
        </Link>

        <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto w-full max-w-md duration-500 motion-reduce:animate-none">
          {children}
        </div>
      </main>
    </div>
  );
}
