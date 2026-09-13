import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import MathRenderer from './MathRenderer';

export default function BottomSheet({
  isCorrect,
  correctAnswer,
  explanation,
  onContinue,
}) {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md transition-transform duration-200 ease-out max-w-md mx-auto shadow-xl ${
        isCorrect
          ? 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
          : 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {isCorrect ? (
              <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-600 dark:bg-rose-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                <XCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {isCorrect ? 'Верно' : 'Неверный ответ'}
              </h3>
              {!isCorrect && (
                <div className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span>Правильный ответ: </span>
                  <MathRenderer content={correctAnswer} />
                </div>
              )}
            </div>
          </div>

          {explanation && !isCorrect && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Решение</span>
              {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Step-by-step LaTeX solution drawer */}
        {showExplanation && explanation && (
          <div className="bg-white/95 dark:bg-slate-900/95 rounded-xl p-3.5 text-sm text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 mt-0.5 shadow-inner">
            <h4 className="font-mono font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Пошаговое доказательство:
            </h4>
            <MathRenderer content={explanation} block={true} />
          </div>
        )}

        <button
          onClick={onContinue}
          className={`w-full py-3 rounded-xl font-bold text-base tracking-wide transition-all active:scale-[0.99] mt-1 ${
            isCorrect
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm'
          }`}
        >
          {isCorrect ? 'Далее' : 'Понятно'}
        </button>
      </div>
    </div>
  );
}
