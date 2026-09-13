import React from 'react';
import { X, Heart, Flame, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header({
  progress = 0,
  hearts = 5,
  streak = 0,
  onClose,
  showProgress = true,
  heartPulsing = false,
}) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between gap-3 max-w-md mx-auto w-full transition-colors duration-200">
      {onClose ? (
        <button
          onClick={onClose}
          className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 active:scale-95 transition-transform p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>
      ) : (
        <div className="w-2" />
      )}

      {showProgress && (
        <div className="flex-1 mx-2">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 select-none">
        {/* Streak counter */}
        <div className="flex items-center gap-1 font-bold text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800/50">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{streak}</span>
        </div>

        {/* Hearts counter */}
        <div
          className={`flex items-center gap-1 font-bold text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200/80 dark:border-rose-800/50 transition-transform ${
            heartPulsing ? 'animate-heart-pulse scale-110' : ''
          }`}
        >
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span>{hearts}</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95"
          aria-label="Переключить тему"
          title={isDark ? 'Светлая тема' : 'Тёмная тема'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
