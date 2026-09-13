import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * useQuizEngine
 * Manages the quiz question queue with an interval re-insertion error loop:
 * When a student answers incorrectly, the question is marked with `isRetry: true`
 * and re-inserted 3-4 steps ahead in the queue (or at the end if fewer questions remain).
 */
export function useQuizEngine({
  questions = [],
  initialHearts = 5,
  onComplete,
}) {
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const [initialCount, setInitialCount] = useState(() => Math.max(1, questions.length));

  // Format questions with retry tracking flags
  const [queue, setQueue] = useState(() =>
    questions.map((q) => ({
      ...q,
      isRetry: false,
      retryCount: 0,
      failedFirstTry: false,
    }))
  );

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(initialHearts);
  const [heartsLost, setHeartsLost] = useState(0);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(new Set());
  const [failedQuestionIds, setFailedQuestionIds] = useState(new Set());
  const [completedUniqueIds, setCompletedUniqueIds] = useState(new Set());

  // Current question is always head of the queue
  const currentQuestion = queue[0] || null;

  // Reinitialize engine when questions or session changes
  const resetEngine = useCallback((newQuestions, newHearts) => {
    const formatted = (newQuestions || []).map((q) => ({
      ...q,
      isRetry: false,
      retryCount: 0,
      failedFirstTry: false,
    }));
    setQueue(formatted);
    setInitialCount(Math.max(1, formatted.length));
    setSelectedAnswer(null);
    setAnswerChecked(false);
    setIsCorrect(false);
    if (newHearts !== undefined) setHearts(newHearts);
    setHeartsLost(0);
    setHeartPulsing(false);
    setFirstTryCorrect(new Set());
    setFailedQuestionIds(new Set());
    setCompletedUniqueIds(new Set());
  }, []);

  const selectAnswer = useCallback((ans) => {
    if (answerChecked) return;
    setSelectedAnswer(ans);
  }, [answerChecked]);

  const checkAnswer = useCallback(() => {
    if (selectedAnswer === null || selectedAnswer === undefined || answerChecked || !currentQuestion) {
      return null;
    }

    const correct = String(selectedAnswer).trim() === String(currentQuestion.correct_answer).trim();
    setIsCorrect(correct);
    setAnswerChecked(true);

    if (correct) {
      // If it wasn't a retry, record as first-try success
      if (!currentQuestion.failedFirstTry && currentQuestion.retryCount === 0) {
        setFirstTryCorrect((prev) => new Set(prev).add(currentQuestion.id));
      }
      setCompletedUniqueIds((prev) => new Set(prev).add(currentQuestion.id));
    } else {
      // Record mistake
      setFailedQuestionIds((prev) => new Set(prev).add(currentQuestion.id));
      setHearts((prev) => Math.max(0, prev - 1));
      setHeartsLost((prev) => prev + 1);
      setHeartPulsing(true);
      setTimeout(() => setHeartPulsing(false), 400);
    }

    return correct;
  }, [selectedAnswer, answerChecked, currentQuestion]);

  const advanceQuestion = useCallback(() => {
    if (!currentQuestion) return;

    setAnswerChecked(false);
    setSelectedAnswer(null);

    const remaining = queue.slice(1);

    if (!isCorrect) {
      // Question was answered incorrectly -> Re-insert with 3-4 step delay
      const updatedQuestion = {
        ...currentQuestion,
        isRetry: true,
        retryCount: (currentQuestion.retryCount || 0) + 1,
        failedFirstTry: true,
      };

      // Spaced repetition insertion: 3 steps delay (or at the end if fewer than 3 questions remain)
      const delay = 3;
      if (remaining.length <= delay) {
        remaining.push(updatedQuestion);
      } else {
        remaining.splice(delay, 0, updatedQuestion);
      }
    }

    setQueue(remaining);

    if (remaining.length === 0) {
      // All questions in queue successfully resolved
      const finalAccuracy = Math.round((firstTryCorrect.size / initialCount) * 100);
      if (typeof onCompleteRef.current === 'function') {
        onCompleteRef.current({
          accuracy: finalAccuracy,
          failedQuestionIds: Array.from(failedQuestionIds),
          heartsLost,
          heartsRemaining: hearts,
        });
      }
    }
  }, [currentQuestion, queue, isCorrect, firstTryCorrect.size, initialCount, failedQuestionIds, heartsLost, hearts]);

  // Monotonic progress percentage
  const progressPercent = useMemo(() => {
    const count = completedUniqueIds.size + (answerChecked && isCorrect && !completedUniqueIds.has(currentQuestion?.id) ? 1 : 0);
    return Math.min(100, Math.round((count / initialCount) * 100));
  }, [completedUniqueIds.size, answerChecked, isCorrect, currentQuestion?.id, initialCount]);

  return {
    queue,
    currentQuestion,
    selectedAnswer,
    answerChecked,
    isCorrect,
    hearts,
    heartPulsing,
    heartsLost,
    firstTryCorrect,
    failedQuestionIds,
    initialCount,
    progressPercent,
    selectAnswer,
    checkAnswer,
    advanceQuestion,
    resetEngine,
  };
}
export default useQuizEngine;
