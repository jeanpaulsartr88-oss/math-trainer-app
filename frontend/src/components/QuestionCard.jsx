import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import MathRenderer from './MathRenderer';
import OptionButton from './OptionButton';
import { sound } from '../utils/sound';
import { hapticSelection } from '../utils/telegram';

export default function QuestionCard({
  question,
  onAnswer,
  isLocked = false,
  disabled = false,
  selectedAnswer,
  setSelectedAnswer,
  onSelectAnswer,
  isCorrect = false,
  answerChecked = false,
}) {
  const [inputText, setInputText] = useState('');

  if (!question) return null;

  const locked = Boolean(isLocked || disabled || answerChecked);
  const isChoice = question.question_type === 'choice' || !question.question_type;
  const isInput = question.question_type === 'input';

  const handleSelect = (opt) => {
    if (locked) return;
    sound.playSelect();
    hapticSelection();
    if (typeof onSelectAnswer === 'function') {
      onSelectAnswer(opt);
    }
    if (typeof setSelectedAnswer === 'function') {
      setSelectedAnswer(opt);
    }
    if (typeof onAnswer === 'function') {
      onAnswer(opt);
    }
  };

  const handleInputChange = (e) => {
    if (locked) return;
    const val = e.target.value;
    setInputText(val);
    if (typeof onSelectAnswer === 'function') {
      onSelectAnswer(val);
    }
    if (typeof setSelectedAnswer === 'function') {
      setSelectedAnswer(val);
    }
    if (typeof onAnswer === 'function') {
      onAnswer(val);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Academic Problem Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Математическая задача
            </span>
            {(question.isRetry || question.is_retry) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs animate-pulse">
                <RotateCcw className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                <span>Второй шанс</span>
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
            {isChoice ? 'Выбор ответа' : 'Точный ввод'}
          </span>
        </div>
        <div className="text-lg sm:text-xl font-medium text-slate-900 dark:text-slate-100 text-center py-2">
          <MathRenderer content={question.latex_text} block={true} />
        </div>
      </div>

      {/* Answer Options */}
      {isChoice && (
        <div className="space-y-2.5 pt-1">
          {question.options?.map((opt, idx) => {
            const isSelected = selectedAnswer !== null && selectedAnswer !== undefined &&
              String(selectedAnswer).trim() === String(opt).trim();
            const isOptionCorrect = answerChecked && String(opt).trim() === String(question.correct_answer).trim();
            const isOptionWrong = answerChecked && isSelected && !isCorrect;

            return (
              <OptionButton
                key={idx}
                index={idx}
                text={opt}
                option={opt}
                isSelected={isSelected}
                isCorrect={isOptionCorrect}
                isWrong={isOptionWrong}
                isLocked={locked}
                onSelect={() => handleSelect(opt)}
                onClick={() => handleSelect(opt)}
              />
            );
          })}
        </div>
      )}

      {isInput && (
        <div className="pt-2">
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            disabled={locked}
            placeholder="Введите число или выражение..."
            className="w-full text-center text-lg font-mono font-medium py-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>
      )}
    </div>
  );
}
