import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import QuestionCard from './QuestionCard';
import BottomSheet from './BottomSheet';
import { api } from '../api';
import { storageService } from '../services/storageService';
import { sound } from '../utils/sound';
import { hapticSuccess, hapticError, setupBackButton, hideBackButton } from '../utils/telegram';
import { MathGenerators } from '../services/mathGenerator';
import { useQuizEngine } from '../hooks/useQuizEngine';

export default function LessonScreen({
  lesson,
  user,
  onFinish,
  onExit,
  onOpenPractice,
}) {
  const [loading, setLoading] = useState(true);

  // Setup Back button
  useEffect(() => {
    setupBackButton(onExit);
    return () => hideBackButton();
  }, [onExit]);

  const handleLessonComplete = useCallback(
    async ({ accuracy, failedQuestionIds, heartsLost, heartsRemaining }) => {
      try {
        const res = await storageService.saveLessonResult({
          lessonId: lesson.id,
          xpEarned: lesson.xp_reward,
          accuracy,
          failedQuestionIds,
          heartsLost,
        });

        // Fire optional backend telemetry
        api.completeLesson(lesson.id, {
          xp_earned: lesson.xp_reward,
          hearts_lost: heartsLost,
          failed_question_ids: failedQuestionIds,
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
          heartsRemaining: heartsRemaining,
        });
      }
    },
    [lesson, user?.streak_days, onFinish]
  );

  const engine = useQuizEngine({
    questions: lesson?.questions || [],
    initialHearts: user?.hearts ?? 5,
    onComplete: handleLessonComplete,
  });

  // Initialize fresh procedural questions immediately on mount or retry
  useEffect(() => {
    let qs = lesson?.questions;
    if (!qs || qs.length === 0) {
      const topicSlug = lesson?.topic_slug || 'fsu';
      qs = MathGenerators.generateBatch(topicSlug, 10).map((q, idx) => ({
        ...q,
        lesson_id: lesson?.id,
        order_index: idx + 1,
        question_type: 'choice',
      }));
    }

    engine.resetEngine(qs, user?.hearts ?? 5);
    setLoading(false);
  }, [lesson?.id, lesson?.sessionId]);

  const handleCheck = () => {
    const isCorrect = engine.checkAnswer();
    if (isCorrect === null) return;

    if (isCorrect) {
      sound.playCorrect();
      hapticSuccess();
    } else {
      sound.playIncorrect();
      hapticError();
    }
  };

  const handleContinue = () => {
    engine.advanceQuestion();
  };

  if (loading || !engine.currentQuestion) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header
        progress={engine.progressPercent}
        hearts={engine.hearts}
        streak={user?.streak_days || 0}
        onClose={onExit}
        heartPulsing={engine.heartPulsing}
      />

      {/* Main scrollable question viewport */}
      <main className="flex-1 overflow-y-auto p-4 pb-28">
        {engine.currentQuestion && (
          <QuestionCard
            question={engine.currentQuestion}
            selectedAnswer={engine.selectedAnswer}
            setSelectedAnswer={engine.selectAnswer}
            onSelectAnswer={engine.selectAnswer}
            isLocked={engine.answerChecked}
            disabled={engine.answerChecked}
            answerChecked={engine.answerChecked}
            isCorrect={engine.isCorrect}
          />
        )}
      </main>

      {/* Action check button */}
      {!engine.answerChecked && (
        <footer className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-20 max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={handleCheck}
            disabled={engine.selectedAnswer === null || engine.selectedAnswer === undefined || engine.answerChecked}
            className={`w-full py-3.5 rounded-xl font-bold text-base transition-all ${
              engine.selectedAnswer !== null && engine.selectedAnswer !== undefined && !engine.answerChecked
                ? 'btn-academic-primary cursor-pointer'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            Проверить
          </button>
        </footer>
      )}

      {/* Bottom sheet feedback with LaTeX explanation drawer */}
      {engine.answerChecked && engine.currentQuestion && (
        <BottomSheet
          isCorrect={engine.isCorrect}
          correctAnswer={engine.currentQuestion.correct_answer}
          explanation={engine.currentQuestion.explanation_latex}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
