import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BOUNDLESS_DISCORD, BpLayout, PageHead } from "@/components/bp-layout";
import { SUPPORT_SERVER } from "@/lib/catalog";
import { seo } from "@/lib/seo";
import { CONTACT_EMAIL } from "@/lib/site";

export const Route = createFileRoute("/contact-us")({
  head: () =>
    seo({
      title: "Contact — Boundless Production",
      description:
        "Contact Boundless Production: BleachDex support, partnerships and creator collaborations, business enquiries, and our community Discord.",
      path: "/contact-us",
    }),
  component: ContactUs,
});

const TOPICS = ["BleachDex support", "Partnership or collaboration", "Creator or press", "Business enquiry", "Something else"];

function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || "Something went wrong.");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-xl border border-line-bright bg-void-raised p-7">
        <h3 className="font-serif text-[24px]">Message sent.</h3>
        <p className="mt-2 text-bone-dim">Thanks. We read every message and reply by email.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border border-line-bright bg-void-raised p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-bone">
          Name
          <input name="name" required maxLength={80} autoComplete="name" className="field" />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-bone">
          Email
          <input name="email" type="email" required maxLength={120} autoComplete="email" className="field" />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold text-bone">
        Topic
        <select name="topic" className="field" defaultValue={TOPICS[0]}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold text-bone">
        Message
        <textarea name="message" required minLength={10} maxLength={1500} rows={6} className="field" />
      </label>
      {/* Honeypot: real visitors never see or fill this. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {state === "error" ? (
        <p role="alert" className="text-sm font-semibold text-[#b42318]">{error}</p>
      ) : null}
      <div>
        <button type="submit" className="btn btn-fill" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}

function ContactUs() {
  return (
    <BpLayout>
      <PageHead title="Get in touch." eyebrow="Contact">
        Pick the option that fits. For bot problems, our support server is the fastest route.
      </PageHead>
      <section className="pb-24">
        <div className="wrap grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="grid content-start gap-4">
            {[
              { t: "BleachDex support", d: "Bugs, missing rewards, premium questions.", a: <Link to="/bleachdex/contact" className="btn btn-fill">Get BleachDex support</Link> },
              { t: "Community", d: "Follow development, give feedback and meet players.", a: <a href={BOUNDLESS_DISCORD} target="_blank" rel="noreferrer" className="btn btn-outline">Join our Discord</a> },
              { t: "BleachDex server", d: "Live help from the community and the team.", a: <a href={SUPPORT_SERVER} target="_blank" rel="noreferrer" className="btn btn-outline">Open support server</a> },
            ].map((c) => (
              <div key={c.t} className="rounded-xl border border-line-bright bg-void-raised p-6">
                <h2 className="font-serif text-[22px]">{c.t}</h2>
                <p className="mt-1 mb-4 text-[15px] text-bone-dim">{c.d}</p>
                {c.a}
              </div>
            ))}
            {CONTACT_EMAIL ? (
              <p className="text-[15px] text-bone-dim">
                Email: <a className="font-semibold text-azure-bright" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              </p>
            ) : null}
          </div>
          <div>
            <h2 className="mb-4 font-serif text-[26px]">Partnerships, creators and business</h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </BpLayout>
  );
}
