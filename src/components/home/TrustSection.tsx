import { useTranslations } from "next-intl";
import { ShieldCheck, Star, Award, Compass } from "lucide-react";

export default function TrustSection() {
  const t = useTranslations("Trust");

  const pillars = [
    {
      icon: ShieldCheck,
      title: t("card1Title"),
      desc: t("card1Desc"),
      highlight: "RESMİ LİSANSLI",
    },
    {
      icon: Star,
      title: t("card2Title"),
      desc: t("card2Desc"),
      highlight: "5.0 GOOGLE PUANI",
    },
    {
      icon: Award,
      title: t("card3Title"),
      desc: t("card3Desc"),
      highlight: "%100 DİSTRİBÜTÖR",
    },
    {
      icon: Compass,
      title: t("card4Title"),
      desc: t("card4Desc"),
      highlight: "30+ YIL TECRÜBE",
    },
  ];

  return (
    <section className="border-b border-neutral-800/80 bg-neutral-950 py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
            Güvenilirlik &amp; Tecrübe
          </span>
          <h2 className="font-heading text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl mt-2">
            {t("sectionTitle")}
          </h2>
          <p className="mt-3 text-sm text-neutral-400">
            {t("sectionSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-700 hover:bg-neutral-900"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-700 bg-black text-white group-hover:border-[#d4af37] group-hover:text-[#d4af37] transition-all">
                  <Icon className="h-6 w-6" />
                </div>

                <span className="mt-6 inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#d4af37]">
                  {item.highlight}
                </span>

                <h3 className="mt-2 font-heading text-lg font-bold text-white">
                  {item.title}
                </h3>

                <p className="mt-2.5 text-xs leading-relaxed text-neutral-400">
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
