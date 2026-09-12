'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Kritik Bir Hata Oluştu</h2>
          <p className="text-neutral-500 mb-6 max-w-md">
            Sistemde beklenmeyen kritik bir hata meydana geldi. Uygulama kendini toparlayamadı.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg font-medium hover:opacity-80 transition-opacity"
          >
            Tekrar Dene
          </button>
        </div>
      </body>
    </html>
  );
}
