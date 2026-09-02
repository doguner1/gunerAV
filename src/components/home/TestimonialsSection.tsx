import { useTranslations } from "next-intl";
import { Star, CheckCircle, ExternalLink } from "lucide-react";
import { STORE_INFO } from "@/lib/store";

export default function TestimonialsSection() {
  const t = useTranslations("Testimonials");

  const reviews = [
    {
      name: t("review1Name"),
      text: t("review1Text"),
      date: "3 hafta önce",
      stars: 5,
    },
    {
      name: t("review2Name"),
      text: t("review2Text"),
      date: "1 ay önce",
      stars: 5,
    },
    {
      name: t("review3Name"),
      text: t("review3Text"),
      date: "2 ay önce",
      stars: 5,
    },
  ];

  return (
    <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50 dark:bg-black py-20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-xs tracking-wider uppercase text-neutral-600 dark:text-neutral-400">
                Google Haritalar
              </span>
              <div className="flex items-center text-amber-500 dark:text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="font-black text-neutral-950 dark:text-white text-sm">5.0 / 5.0</span>
            </div>
            <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
              {t("sectionTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
              {t("sectionSubtitle")}
            </p>
          </div>

          <a
            href={STORE_INFO.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-800 dark:text-neutral-300 transition-colors hover:bg-neutral-100 dark:hover:border-neutral-700 hover:text-black dark:hover:text-white shadow-sm"
          >
            <span>Google'da Tüm Yorumları Gör</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Reviews Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex text-amber-500 dark:text-amber-400">
                    {[...Array(rev.stars)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    {rev.date}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300 italic font-medium">
                  "{rev.text}"
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-900 pt-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-950 dark:text-white border border-neutral-200 dark:border-neutral-700">
                  {rev.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-950 dark:text-white">
                    {rev.name}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle className="h-3 w-3" />
                    {t("googleVerified")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
