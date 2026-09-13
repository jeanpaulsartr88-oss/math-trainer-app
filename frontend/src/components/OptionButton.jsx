import React from 'react';
import MathRenderer from './MathRenderer';

export default function OptionButton({
  index,
  text,
  option,
  isSelected,
  isCorrect,
  isWrong,
  isLocked,
  onClick,
  onSelect,
}) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const label = letters[index] || String(index + 1);
  const value = text !== undefined ? text : option;

  const handleClick = (e) => {
    if (isLocked) return;
    if (onSelect) onSelect(value);
    if (onClick) onClick(e);
  };

  let stateClass = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100';
  let badgeClass = 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400';

  if (isCorrect) {
    stateClass = 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 text-emerald-800 dark:text-emerald-200 option-correct';
    badgeClass = 'border-emerald-400 bg-emerald-600 text-white';
  } else if (isWrong) {
    stateClass = 'border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/30 text-rose-800 dark:text-rose-200 option-wrong';
    badgeClass = 'border-rose-400 bg-rose-600 text-white';
  } else if (isSelected) {
    stateClass = 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30 text-blue-900 dark:text-blue-100 option-selected';
    badgeClass = 'border-blue-400 bg-blue-600 text-white';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLocked}
      className={`w-full min-h-[56px] px-4 py-3 rounded-xl border flex items-center gap-3.5 text-left font-medium text-base transition-all duration-150 ${stateClass} ${
        isLocked ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
      }`}
    >
      <div className="pointer-events-none flex items-center gap-3.5 w-full">
        <span
          className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md border font-mono text-xs font-semibold transition-colors ${badgeClass}`}
        >
          {label}
        </span>
        <div className="flex-1 overflow-x-auto py-0.5 leading-snug">
          <MathRenderer content={value} />
        </div>
      </div>
    </button>
  );
}
