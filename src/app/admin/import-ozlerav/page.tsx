import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import ImportOzlerAvClient from "@/components/admin/ImportOzlerAvClient";

export const metadata = {
  title: "Özler Av İçe Aktar | Güner AV Admin",
};

export default function ImportOzlerAvPage() {
  const cookieStore = cookies();
  const token = cookieStore.get("gunerav_admin_token");

  if (!token) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-black text-neutral-200">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Özler Av İçe Aktarım</h1>
          <p className="text-neutral-400 mt-2">
            Özler Av sitemap'ini veya kategori linklerini tarayarak eksik ürünleri sisteme ekleyin.
          </p>
        </div>
        <ImportOzlerAvClient />
      </main>
    </div>
  );
}
