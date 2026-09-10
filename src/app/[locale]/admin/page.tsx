import { setRequestLocale } from "next-intl/server";
import AdminClient from "@/components/admin/AdminClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yönetim Paneli | Güner AV",
  robots: "noindex, nofollow",
};

export default async function AdminPage({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-black pt-20 pb-20">
      <AdminClient />
    </div>
  );
}
