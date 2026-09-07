"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const t = useTranslations("Contact");
  const tCommon = useTranslations("Common");

  const [formState, setFormState] = useState<{
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }>({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
  });

  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Anti-Bot Honeypot Security Trap: Botlar doldurursa istek sessizce engellenir
    if (honeypot.trim().length > 0) {
      console.warn("[Security] Bot faaliyeti tespit edildi ve engellendi.");
      setStatus("success");
      return;
    }

    setStatus("submitting");

    // Vitrin site simulation delay
    setTimeout(() => {
      setStatus("success");
    }, 800);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 sm:p-8 shadow-sm dark:shadow-2xl transition-colors">
      <div className="mb-6">
        <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white">
          {t("formTitle")}
        </h2>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400 font-medium">
          {tCommon("fillFormPrompt")}
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-6 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400 mb-3" />
          <h3 className="font-heading text-lg font-bold text-neutral-950 dark:text-white">
            {t("successMessage")}
          </h3>
          <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto font-medium">
            {tCommon("fillFormPrompt")}
          </p>
          <button
            type="button"
            onClick={() => {
              setFormState({ name: "", email: "", phone: "", subject: "general", message: "" });
              setStatus("idle");
            }}
            className="mt-6 rounded-xl bg-neutral-950 dark:bg-white px-6 py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-sm"
          >
            {tCommon("sendAnotherMessage")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Güvenlik: Bot kapanı (Honeypot) */}
          <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
            <input
              type="text"
              name="gunerav_security_hp"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("name")} *
              </label>
              <input
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                placeholder={tCommon("placeholderName")}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-950 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white transition-colors"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("phone")} *
              </label>
              <input
                type="tel"
                required
                value={formState.phone}
                onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                placeholder={tCommon("placeholderPhone")}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-950 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("email")}
              </label>
              <input
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                placeholder={tCommon("placeholderEmail")}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-950 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white transition-colors"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
                {t("subject")}
              </label>
              <select
                value={formState.subject}
                onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-950 dark:text-white focus:border-neutral-950 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white transition-colors"
              >
                <option value="general">{t("subjectGeneral")}</option>
                <option value="product">{t("subjectProduct")}</option>
                <option value="license">{t("subjectLicense")}</option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1.5">
              {t("message")} *
            </label>
            <textarea
              required
              rows={4}
              value={formState.message}
              onChange={(e) => setFormState({ ...formState, message: e.target.value })}
              placeholder={tCommon("placeholderMessage")}
              className="w-full resize-none rounded-xl border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-3.5 py-2.5 text-xs text-neutral-950 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:border-neutral-950 dark:focus:border-white focus:outline-none focus:ring-1 focus:ring-neutral-950 dark:focus:ring-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 dark:bg-white py-3 text-xs font-extrabold uppercase tracking-wider text-white dark:text-black transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-98 disabled:opacity-50 shadow-md"
          >
            <Send className="h-4 w-4" />
            <span>{status === "submitting" ? t("sending") : t("send")}</span>
          </button>
        </form>
      )}
    </div>
  );
}
