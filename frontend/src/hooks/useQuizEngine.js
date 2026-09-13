import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * useQuizEngine
 * Manages the quiz question queue with an interval re-insertion error loop:
 * When a student answers incorrectly, the question is marked with `isRetry: true`,
 * `failedFirstTry: true`, and re-inserted 3-4 steps ahead in the queue (+3..4 steps).
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

  // Format initial questions with retry tracking flags
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
      // Если failedFirstTry === false, увеличивается счетчик firstTryCorrect
      if (!currentQuestion.failedFirstTry && currentQuestion.retryCount === 0) {
        setFirstTryCorrect((prev) => new Set(prev).add(currentQuestion.id));
      }
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

    const newQueue = [...queue];
    const current = newQueue.shift();

    if (!isCorrect) {
      // Логика ошибки и интервальная вставка (+3..4 шага)
      const failedItem = { ...current };
      failedItem.failedFirstTry = true;
      failedItem.isRetry = true;
      failedItem.retryCount = (failedItem.retryCount || 0) + 1;

      // Смещение:
      // Если queue.length >= 4: вставляем строго через 3 или 4 позиции:
      // const offset = Math.floor(Math.random() * 2) + 3;
      // queue.splice(offset, 0, failedItem);
      // Если queue.length < 4: отправляем в конец: queue.push(failedItem);
      // Если в очереди был только 1 вопрос: он остаётся единственным и показывается вновь.
      if (newQueue.length >= 4) {
        const offset = Math.floor(Math.random() * 2) + 3; // 3 or 4
        newQueue.splice(offset, 0, failedItem);
      } else {
        newQueue.push(failedItem);
      }
    }

    setQueue(newQueue);

    if (newQueue.length === 0) {
      // Урок продолжается до тех пор, пока массив queue не станет пустым
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

  // Прогресс-бар: считается только по первично решённым задачам
  const progressPercent = useMemo(() => {
    return Math.min(100, Math.round((firstTryCorrect.size / initialCount) * 100));
  }, [firstTryCorrect.size, initialCount]);

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
