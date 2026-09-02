import Link from "next/link";
import "./globals.css";

export default function RootNotFound() {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-4xl font-black">404</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Sayfa bulunamadı.
          </p>
          <Link
            href="/tr"
            className="mt-6 inline-block rounded-xl bg-white px-5 py-2.5 text-xs font-bold uppercase text-black"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </body>
    </html>
  );
}
