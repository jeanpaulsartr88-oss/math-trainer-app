import React, { useState } from 'react';
import MathRenderer from './MathRenderer';
import OptionButton from './OptionButton';
import { sound } from '../utils/sound';
import { hapticSelection } from '../utils/telegram';

export default function QuestionCard({
  question,
  onAnswer,
  isLocked,
  selectedAnswer,
  setSelectedAnswer,
  isCorrect,
  answerChecked,
}) {
  const [inputText, setInputText] = useState('');

  if (!question) return null;

  const isChoice = question.question_type === 'choice' || !question.question_type;
  const isInput = question.question_type === 'input';

  const handleSelect = (opt) => {
    if (isLocked) return;
    sound.playSelect();
    hapticSelection();
    setSelectedAnswer(opt);
  };

  const handleInputChange = (e) => {
    if (isLocked) return;
    setInputText(e.target.value);
    setSelectedAnswer(e.target.value);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Academic Problem Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
            Математическая задача
          </span>
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
            const isSelected = selectedAnswer === opt;
            const isOptionCorrect = answerChecked && opt === question.correct_answer;
            const isOptionWrong = answerChecked && isSelected && !isCorrect;

            return (
              <OptionButton
                key={idx}
                index={idx}
                text={opt}
                isSelected={isSelected}
                isCorrect={isOptionCorrect}
                isWrong={isOptionWrong}
                isLocked={isLocked}
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
            disabled={isLocked}
            placeholder="Введите число или выражение..."
            className="w-full text-center text-lg font-mono font-medium py-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 transition-colors"
          />
        </div>
      )}
    </div>
  );
}
