'use client';

import { useLanguage } from '@/hooks/useLanguage';

export function LanguageTest() {
  const { language, t } = useLanguage();
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-sm z-50">
      <div className="mb-2">
        <strong>Current Language:</strong> {language}
      </div>
      <div className="space-y-1 text-xs">
        <div>Home: {t('home')}</div>
        <div>Loading: {t('loading')}</div>
        <div>Game Title: {t('gameTitle')}</div>
        <div>Leaderboard: {t('leaderboard')}</div>
      </div>
    </div>
  );
}