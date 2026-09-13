import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, RotateCcw } from 'lucide-react';
import Header from './Header';
import QuestionCard from './QuestionCard';
import BottomSheet from './BottomSheet';
import { api } from '../api';
import { storageService } from '../services/storageService';
import { sound } from '../utils/sound';
import { hapticSuccess, hapticError } from '../utils/telegram';

export default function PracticeMode({ user, mistakeIds = [], onExit, onHeartsUpdated }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [currentHearts, setCurrentHearts] = useState(user?.hearts ?? 5);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await api.getPracticeQuestions(mistakeIds);
      setQuestions(data.questions || []);
    } catch (e) {
      console.error('Failed to load practice questions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [mistakeIds]);

  const currentQuestion = questions[currentIndex];

  const handleCheckAnswer = async () => {
    if (!selectedAnswer || isAnswerChecked || !currentQuestion) return;

    const correct = selectedAnswer.trim() === currentQuestion.correct_answer.trim();
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      sound.playCorrect();
      hapticSuccess();
      try {
        const res = await storageService.resolvePracticeQuestion(currentQuestion.id, true);
        if (res.heartRecovered) {
          setCurrentHearts(res.hearts);
          setHeartPulsing(true);
          setTimeout(() => setHeartPulsing(false), 400);
          onHeartsUpdated(res.hearts);
        }
        api.submitPracticeAnswer(currentQuestion.id, true);
      } catch (e) {
        console.error(e);
      }
    } else {
      sound.playIncorrect();
      hapticError();
      try {
        api.submitPracticeAnswer(currentQuestion.id, false);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleContinue = () => {
    setIsAnswerChecked(false);
    setSelectedAnswer(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setFinished(true);
    }
  };

  const handleRetryPractice = async () => {
    setFinished(false);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    await loadQuestions();
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500"></div>
      </div>
    );
  }

  if (finished || questions.length === 0) {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col justify-between p-6 bg-white dark:bg-slate-900 text-center transition-colors duration-200">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mb-5 border border-rose-200 dark:border-rose-800/60">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Практикум завершён
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-5 font-mono">
            Запас попыток: <span className="text-rose-600 dark:text-rose-400 font-bold">{currentHearts} / 5 ❤️</span>
          </p>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl p-3.5 text-xs font-semibold max-w-xs">
            Материал закреплён. Вы можете пройти дополнительный раунд практики или вернуться к темам.
          </div>
        </div>

        <div className="w-full pt-4 flex flex-col gap-2.5">
          <button
            onClick={handleRetryPractice}
            className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Пройти ещё раз</span>
          </button>
          <button
            onClick={onExit}
            className="w-full btn-academic-primary py-3.5 rounded-xl font-bold text-base shadow-xs active:scale-[0.99]"
          >
            Вернуться к темам
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        progress={progress}
        hearts={currentHearts}
        streak={user?.streak_days || 0}
        onClose={onExit}
        heartPulsing={heartPulsing}
      />

      <div className="px-4 pt-3">
        <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50 rounded-xl px-3 py-2 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold">Свободная практика (попытки не списываются)</span>
          </div>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">+1 ❤️</span>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 pb-28">
        <QuestionCard
          question={currentQuestion}
          isLocked={isAnswerChecked}
          selectedAnswer={selectedAnswer}
          setSelectedAnswer={setSelectedAnswer}
          isCorrect={isCorrect}
          answerChecked={isAnswerChecked}
        />
      </main>

      {!isAnswerChecked && (
        <footer className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20 max-w-md mx-auto w-full">
          <button
            onClick={handleCheckAnswer}
            disabled={!selectedAnswer}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
              selectedAnswer
                ? 'btn-academic-primary cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            Проверить
          </button>
        </footer>
      )}

      {isAnswerChecked && currentQuestion && (
        <BottomSheet
          isCorrect={isCorrect}
          correctAnswer={currentQuestion.correct_answer}
          explanation={currentQuestion.explanation_latex}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
