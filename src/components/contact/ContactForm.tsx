"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const t = useTranslations("Contact");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate lightweight client submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "general",
        message: "",
      });
    }, 600);
  };

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 shadow-2xl">
      <h3 className="font-heading text-xl font-bold uppercase text-white mb-2">
        {t("formTitle")}
      </h3>
      <p className="text-xs text-neutral-400 mb-6">
        Formu doldurun, çalışma saatleri içerisinde en kısa sürede size dönüş yapalım.
      </p>

      {submitted ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-6 text-center animate-in fade-in">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-3" />
          <h4 className="font-heading text-base font-bold text-white">
            {t("successMessage")}
          </h4>
          <p className="mt-1 text-xs text-neutral-300">
            Ekibimiz en kısa zamanda belirttiğiniz telefon veya e-posta üzerinden sizinle iletişim kuracaktır.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-4 rounded-lg bg-neutral-800 px-4 py-2 text-xs font-semibold text-white hover:bg-neutral-700"
          >
            Yeni Mesaj Gönder
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t("name")} *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none"
              placeholder="Örn: Ahmet Yılmaz"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t("phone")} *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                placeholder="0545 000 00 00"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t("email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                placeholder="ornek@mail.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t("subject")}
            </label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white focus:border-white focus:outline-none"
            >
              <option value="general">{t("subjectGeneral")}</option>
              <option value="product">{t("subjectProduct")}</option>
              <option value="license">{t("subjectLicense")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t("message")} *
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-white focus:outline-none resize-none"
              placeholder="Sorunuzu veya merak ettiğiniz ekipmanı yazınız..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-98 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{loading ? t("sending") : t("send")}</span>
          </button>
        </form>
      )}
    </div>
  );
}
