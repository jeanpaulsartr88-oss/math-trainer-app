import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Zap, Target, Flame, ArrowRight, RotateCcw } from 'lucide-react';
import { sound } from '../utils/sound';
import { hapticSuccess } from '../utils/telegram';

export default function CompletionScreen({
  xpEarned = 20,
  accuracy = 100,
  streak = 1,
  streakIncremented = false,
  onRetry,
  onContinue,
}) {
  useEffect(() => {
    sound.playComplete();
    hapticSuccess();

    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 45,
        origin: { x: 0, y: 0.7 },
        colors: ['#2563EB', '#10B981', '#F59E0B'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 45,
        origin: { x: 1, y: 0.7 },
        colors: ['#2563EB', '#10B981', '#F59E0B'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col justify-between p-6 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
        {/* Academic Certificate Badge */}
        <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center border border-blue-200 dark:border-blue-800/60 shadow-xs mb-5">
          <Award className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-1.5">
          Тема успешно освоена
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Все задачи решены и проверены
        </p>

        {/* Academic Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs mb-6">
          {/* XP */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-mono font-medium mb-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Опыт</span>
            </div>
            <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">+{xpEarned}</span>
          </div>

          {/* Accuracy */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-mono font-medium mb-1">
              <Target className="w-3 h-3 text-emerald-500" />
              <span>Точность</span>
            </div>
            <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">{accuracy}%</span>
          </div>

          {/* Streak */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px] font-mono font-medium mb-1">
              <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Стрик</span>
            </div>
            <span className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">{streak} дн</span>
          </div>
        </div>

        {streakIncremented && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs font-semibold">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Непрерывный стрик увеличен до {streak} дн!</span>
          </div>
        )}
      </div>

      <div className="w-full pt-4 flex flex-col gap-2.5">
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Пройти ещё раз</span>
          </button>
        )}
        <button
          onClick={onContinue}
          className="w-full btn-academic-primary py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
        >
          <span>К списку тем</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
