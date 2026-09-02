import { useTranslations } from "next-intl";
import { getDealsProducts, getAllCategories } from "@/lib/products";
import ProductCard from "@/components/product/ProductCard";
import { Tag, Sparkles } from "lucide-react";

export default function CampaignSection() {
  const t = useTranslations("Products");
  const deals = getDealsProducts();
  const categories = getAllCategories();

  if (deals.length === 0) return null;

  return (
    <section className="border-b border-neutral-800/80 bg-gradient-to-b from-neutral-950 via-black to-neutral-950 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 px-3 py-1 text-xs font-bold text-[#d4af37] uppercase tracking-wider mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Avantajlı Fırsatlar</span>
            </div>
            <h2 className="font-heading text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
              {t("dealsTitle")}
            </h2>
            <p className="mt-2 text-sm text-neutral-400 max-w-xl">
              {t("dealsSubtitle")}
            </p>
          </div>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((product) => {
            const cat = categories.find((c) => c.id === product.category);
            return (
              <ProductCard
                key={product.id}
                product={product}
                categoryName={cat?.name_tr}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
