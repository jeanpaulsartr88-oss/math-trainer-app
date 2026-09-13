import React, { useState, useEffect } from 'react';
import Header from './Header';
import QuestionCard from './QuestionCard';
import BottomSheet from './BottomSheet';
import { api } from '../api';
import { storageService } from '../services/storageService';
import { sound } from '../utils/sound';
import { hapticSuccess, hapticError, setupBackButton, hideBackButton } from '../utils/telegram';
import { getFallbackLessonQuestions } from '../data/curriculumFallback';

export default function LessonScreen({
  lesson,
  user,
  onFinish,
  onExit,
  onOpenPractice,
}) {
  const [questions, setQuestions] = useState([]);
  const [activeQueue, setActiveQueue] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);

  // Session accuracy & mistake tracking
  const [hearts, setHearts] = useState(user?.hearts ?? 5);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const [heartsLost, setHeartsLost] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(new Set());
  const [failedQuestionIds, setFailedQuestionIds] = useState(new Set());
  const [initialCount, setInitialCount] = useState(1);

  // Setup Back button
  useEffect(() => {
    setupBackButton(onExit);
    return () => hideBackButton();
  }, [onExit]);

  // Load questions on mount with guaranteed fallback
  useEffect(() => {
    async function load() {
      try {
        const res = await api.getLesson(lesson.id);
        const qs = (res.questions && res.questions.length > 0)
          ? res.questions
          : getFallbackLessonQuestions(lesson.id);

        setQuestions(qs);
        setActiveQueue([...qs]);
        setInitialCount(qs.length || 1);
        if (qs.length > 0) {
          setCurrentQuestion(qs[0]);
        }
      } catch (err) {
        console.warn('Network error loading lesson, using local fallback:', err);
        const qs = getFallbackLessonQuestions(lesson.id);
        setQuestions(qs);
        setActiveQueue([...qs]);
        setInitialCount(qs.length || 1);
        if (qs.length > 0) {
          setCurrentQuestion(qs[0]);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lesson.id]);

  const handleCheck = () => {
    if (selectedAnswer === null || selectedAnswer === undefined || answerChecked || !currentQuestion) return;

    const correct = String(selectedAnswer).trim() === String(currentQuestion.correct_answer).trim();
    setIsCorrect(correct);
    setAnswerChecked(true);

    if (correct) {
      sound.playCorrect();
      hapticSuccess();

      // If never failed before, count as first-try success
      if (!failedQuestionIds.has(currentQuestion.id)) {
        setFirstTryCorrect((prev) => new Set(prev).add(currentQuestion.id));
      }
    } else {
      sound.playIncorrect();
      hapticError();

      // Record mistake
      setFailedQuestionIds((prev) => new Set(prev).add(currentQuestion.id));

      // Decrement hearts as accuracy indicator (clamped at 0, no blocking!)
      const nextHearts = Math.max(0, hearts - 1);
      setHearts(nextHearts);
      setHeartsLost((prev) => prev + 1);
      setHeartPulsing(true);
      setTimeout(() => setHeartPulsing(false), 400);

      // Adaptive Error Loop: question pushed to the tail of activeQueue
      setActiveQueue((prev) => [...prev, currentQuestion]);
    }
  };

  const handleContinue = async () => {
    setAnswerChecked(false);
    setSelectedAnswer(null);

    // Advance queue (zero blockers: reaching 0 hearts never blocks progress!)
    const remaining = activeQueue.slice(1);
    setActiveQueue(remaining);

    if (remaining.length > 0) {
      setCurrentQuestion(remaining[0]);
    } else {
      // Lesson completed
      try {
        const accuracy = Math.round((firstTryCorrect.size / initialCount) * 100);
        const res = await storageService.saveLessonResult({
          lessonId: lesson.id,
          xpEarned: lesson.xp_reward,
          accuracy,
          failedQuestionIds: Array.from(failedQuestionIds),
          heartsLost,
        });

        // Fire optional backend telemetry
        api.completeLesson(lesson.id, {
          xp_earned: lesson.xp_reward,
          hearts_lost: heartsLost,
          failed_question_ids: Array.from(failedQuestionIds),
          first_try_accuracy: accuracy,
        });

        onFinish({
          xpEarned: lesson.xp_reward,
          accuracy,
          streak: res.streak,
          streakIncremented: res.streakIncremented,
          heartsRemaining: res.hearts,
        });
      } catch (err) {
        console.error('Failed to save lesson progress:', err);
        onFinish({
          xpEarned: lesson.xp_reward,
          accuracy: 100,
          streak: (user?.streak_days || 0) + 1,
          streakIncremented: true,
          heartsRemaining: hearts,
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500"></div>
      </div>
    );
  }

  // Progress based on unique questions completed
  const completedCount = Math.max(0, initialCount - (activeQueue.length - (answerChecked && isCorrect ? 1 : 0)));
  const progressPercent = Math.min(100, Math.round((completedCount / initialCount) * 100));

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        progress={progressPercent}
        hearts={hearts}
        streak={user?.streak_days || 0}
        onClose={onExit}
        heartPulsing={heartPulsing}
      />

      {/* Main scrollable question viewport */}
      <main className="flex-1 overflow-y-auto p-4 pb-28">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            setSelectedAnswer={setSelectedAnswer}
            onSelectAnswer={setSelectedAnswer}
            isLocked={answerChecked}
            disabled={answerChecked}
            answerChecked={answerChecked}
            isCorrect={isCorrect}
          />
        )}
      </main>

      {/* Action check button / Bottom sheet */}
      {!answerChecked && (
        <footer className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20 max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={handleCheck}
            disabled={selectedAnswer === null || selectedAnswer === undefined || answerChecked}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
              selectedAnswer !== null && selectedAnswer !== undefined && !answerChecked
                ? 'btn-academic-primary cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            Проверить
          </button>
        </footer>
      )}

      {answerChecked && currentQuestion && (
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
