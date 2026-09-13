import React from 'react';
import { HeartCrack, Sparkles, Clock, X } from 'lucide-react';

export default function HeartsModal({
  isOpen,
  onClose,
  onStartPractice,
  secondsUntilNext = 0,
}) {
  if (!isOpen) return null;

  const hours = Math.floor(secondsUntilNext / 3600);
  const minutes = Math.floor((secondsUntilNext % 3600) / 60);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-800 shadow-2xl animate-fadeIn transition-colors duration-200">
        <div className="flex justify-end mb-1">
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Heart indicator */}
        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800/60">
          <HeartCrack className="w-8 h-8 text-rose-500 fill-rose-500/20" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Лимит попыток исчерпан
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
          Для продолжения основного курса перейдите в практикум над ошибками или дождитесь автоматического восстановления.
        </p>

        {/* Practice info card */}
        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50 rounded-xl p-3.5 text-left mb-5 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-950 dark:text-blue-200">
            <div className="font-bold text-blue-700 dark:text-blue-300 mb-0.5">
              Практикум над ошибками:
            </div>
            Попытки не списываются, а каждое верное решение восстанавливает <span className="font-bold text-rose-600 dark:text-rose-400">+1 ❤️</span>.
          </div>
        </div>

        {secondsUntilNext > 0 && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-5 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Автовосстановление: {hours > 0 ? `${hours}ч ` : ''}{minutes}мин
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            onClick={onStartPractice}
            className="w-full btn-academic-primary py-3 rounded-xl font-bold text-sm tracking-wide shadow-xs active:scale-[0.99]"
          >
            Перейти в практикум
          </button>
          <button
            onClick={onClose}
            className="w-full btn-academic-secondary py-2.5 rounded-xl font-semibold text-sm"
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  );
}
