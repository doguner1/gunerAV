import { useTranslations } from "next-intl";
import { ShieldCheck, Star, Award, Compass } from "lucide-react";

export default function TrustSection() {
  const t = useTranslations("Trust");
  const tCommon = useTranslations("Common");

  const pillars = [
    {
      icon: ShieldCheck,
      title: t("card1Title"),
      desc: t("card1Desc"),
      highlight: tCommon("officialLicensed"),
    },
    {
      icon: Star,
      title: t("card2Title"),
      desc: t("card2Desc"),
      highlight: tCommon("googleScore"),
    },
    {
      icon: Award,
      title: t("card3Title"),
      desc: t("card3Desc"),
      highlight: tCommon("distributor100"),
    },
    {
      icon: Compass,
      title: t("card4Title"),
      desc: t("card4Desc"),
      highlight: tCommon("experience30"),
    },
  ];

  return (
    <section className="border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 py-24 relative overflow-hidden transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b45309] dark:text-[#d4af37]">
            {tCommon("reliabilityAndExperience")}
          </span>
          <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white sm:text-4xl mt-2">
            {t("sectionTitle")}
          </h2>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            {t("sectionSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/60 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-black text-neutral-950 dark:text-white group-hover:border-[#d4af37] group-hover:text-[#d4af37] transition-all shadow-sm">
                  <Icon className="h-6 w-6" />
                </div>

                <span className="mt-6 inline-block text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-[#d4af37]">
                  {item.highlight}
                </span>

                <h3 className="mt-2 font-heading text-lg font-bold text-neutral-950 dark:text-white">
                  {item.title}
                </h3>

                <p className="mt-2.5 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 font-medium">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
