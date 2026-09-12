'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Common');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">{t('errorTitle') || 'Bir Şeyler Yanlış Gitti'}</h2>
      <p className="text-neutral-500 mb-6 max-w-md">
        Beklenmeyen bir hata oluştu. Lütfen sayfayı yenilemeyi veya daha sonra tekrar denemeyi unutmayın.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg font-medium hover:opacity-80 transition-opacity"
      >
        {t('tryAgain') || 'Tekrar Dene'}
      </button>
    </div>
  );
}
