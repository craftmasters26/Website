import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-md border border-line-bright bg-void px-3.5 py-2.5 text-[14px] text-bone outline-none focus:border-azure-bright disabled:opacity-50";

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // keeps the request under Vercel's ~4.5 MB body limit once base64'd

export type Msg = { ok: boolean; text: string } | null;
export type Failure = { status: "forbidden" | "bot-offline" | "error"; message?: string };

export function failureText(f: Failure): string {
  if (f.status === "forbidden") return "You're not allowed to do that.";
  if (f.status === "bot-offline") return "The bot can't be reached right now.";
  return f.message ? `The bot said: ${f.message}` : "Something went wrong.";
}

export function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("block", className)}>
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.08em] text-bone-faint">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block font-mono text-[11px] text-bone-faint">{hint}</span> : null}
    </div>
  );
}

export function Status({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <span
      className={cn("font-mono text-[12px] leading-snug", msg.ok ? "text-azure-bright" : "text-ember-bright")}
      role="status"
    >
      {msg.text}
    </span>
  );
}

export function Panel({
  title,
  blurb,
  children,
  className,
}: {
  title: string;
  blurb?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-md border border-line bg-void-raised p-5", className)}>
      <h3 className="font-serif text-[20px] text-bone">{title}</h3>
      {blurb ? <p className="mt-1 mb-4 text-[13px] text-bone-dim">{blurb}</p> : <div className="mb-4" />}
      {children}
    </section>
  );
}

export function readBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(f);
  });
}

/** An image given as a link OR an uploaded file (the link wins, like the bot expects). */
export type ImageValue = { url: string; file: File | null };
export const emptyImage: ImageValue = { url: "", file: null };

export function ImageInput({
  label,
  value,
  onChange,
  optional = true,
}: {
  label: string;
  value: ImageValue;
  onChange: (v: ImageValue) => void;
  optional?: boolean;
}) {
  return (
    <div className="grid gap-3">
      <Field label={`${label} — link${optional ? "" : " (recommended)"}`}>
        <input
          className={inputCls}
          value={value.url}
          placeholder="https://raw.githubusercontent.com/…/Name.png"
          onChange={(e) => onChange({ ...value, url: e.target.value })}
        />
      </Field>
      <Field label="…or upload a file (PNG / JPG / WEBP, max 3 MB)">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="block w-full text-[13px] text-bone-dim file:mr-3 file:rounded-md file:border file:border-line-bright file:bg-void file:px-3 file:py-2 file:text-bone"
          onChange={(e) => onChange({ ...value, file: e.target.files?.[0] ?? null })}
          disabled={Boolean(value.url.trim())}
        />
      </Field>
    </div>
  );
}

export const hasImage = (v: ImageValue) => Boolean(v.url.trim() || v.file);

/** Turns an ImageValue into the `<prefix>_url` / `<prefix>_base64` pair the bot reads. */
export async function imageBody(
  v: ImageValue,
  urlKey: string | null,
  b64Key: string,
): Promise<Record<string, unknown>> {
  if (v.url.trim() && urlKey) return { [urlKey]: v.url.trim() };
  if (v.file) return { [b64Key]: await readBase64(v.file) };
  return {};
}

export function tooBig(v: ImageValue): boolean {
  return Boolean(v.file && v.file.size > MAX_UPLOAD_BYTES);
}

/** Runs an async action with a busy flag + a one-line result message. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  async function run(fn: () => Promise<Msg>) {
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await fn());
    } catch {
      setMsg({ ok: false, text: "The request failed." });
    } finally {
      setBusy(false);
    }
  }
  return { busy, msg, setMsg, run };
}
