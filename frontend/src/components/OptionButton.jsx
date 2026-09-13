import React from 'react';
import MathRenderer from './MathRenderer';

export default function OptionButton({
  index,
  text,
  isSelected,
  isCorrect,
  isWrong,
  isLocked,
  onClick,
}) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const label = letters[index] || String(index + 1);

  let stateClass = 'option-default';
  let badgeClass = 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

  if (isCorrect) {
    stateClass = 'option-correct';
    badgeClass = 'border-emerald-300 dark:border-emerald-600 bg-emerald-600 text-white';
  } else if (isWrong) {
    stateClass = 'option-wrong';
    badgeClass = 'border-red-300 dark:border-red-600 bg-red-600 text-white';
  } else if (isSelected) {
    stateClass = 'option-selected';
    badgeClass = 'border-blue-300 dark:border-blue-600 bg-blue-600 text-white';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLocked}
      className={`w-full min-h-[56px] px-4 py-3 rounded-xl flex items-center gap-3.5 text-left font-medium text-base transition-all duration-150 ${stateClass} ${
        isLocked ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
      }`}
    >
      <span
        className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border font-mono text-xs font-semibold transition-colors ${badgeClass}`}
      >
        {label}
      </span>
      <div className="flex-1 overflow-x-auto py-0.5 leading-snug">
        <MathRenderer content={text} />
      </div>
    </button>
  );
}
