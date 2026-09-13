import React, { useState, useEffect, useCallback } from 'react';
import TopicList from './components/TopicList';
import LessonScreen from './components/LessonScreen';
import CompletionScreen from './components/CompletionScreen';
import PracticeMode from './components/PracticeMode';
import { api } from './api';
import { initTelegram, getTelegramUser } from './utils/telegram';
import { storageService } from './services/storageService';
import { getFallbackTopics } from './data/curriculumFallback';
import { ThemeProvider } from './context/ThemeContext';

function MainApp() {
  const [view, setView] = useState('roadmap'); // 'roadmap' | 'lesson' | 'completion' | 'practice'
  // Initialize with fallback immediately so screen is NEVER empty
  const [topics, setTopics] = useState(() => getFallbackTopics());
  const [progress, setProgress] = useState({
    streak: 0,
    points: 0,
    completedLessons: [],
    mistakes: [],
    hearts: 5,
    secondsUntilNextHeart: 0,
  });
  const [studentName, setStudentName] = useState('Ученик');
  const [activeLesson, setActiveLesson] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh progress from Telegram CloudStorage / LocalStorage
  const refreshProgress = useCallback(async () => {
    try {
      const p = await storageService.getProgress();
      setProgress(p);
    } catch (err) {
      console.warn('Failed to load progress from storage:', err);
    }
  }, []);

  // Initialize application instantly without auth barriers
  useEffect(() => {
    initTelegram();

    const tgUser = getTelegramUser();
    if (tgUser?.first_name) {
      setStudentName(tgUser.first_name);
    }

    async function initialize() {
      try {
        const [topicsRes, p] = await Promise.all([
          api.getTopics(),
          storageService.getProgress(),
        ]);
        if (Array.isArray(topicsRes.topics) && topicsRes.topics.length > 0) {
          setTopics(topicsRes.topics);
        }
        setProgress(p);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // Infinite replayability: Any lesson can be started at any time without heart blockers
  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
    setView('lesson');
  };

  const handleFinishLesson = (results) => {
    setCompletionData(results);
    setView('completion');
    refreshProgress();
  };

  const handleRetryLesson = () => {
    setCompletionData(null);
    setView('lesson');
  };

  if (loading && topics.length === 0) {
    return (
      <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center shadow-xs mb-3">
          <span className="text-2xl font-serif font-bold text-white">∑</span>
        </div>
        <div className="font-semibold text-slate-500 dark:text-slate-400 text-sm font-mono">
          Загрузка курса...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {view === 'roadmap' && (
        <TopicList
          topics={topics}
          user={{
            first_name: studentName,
            xp: progress.points,
            streak_days: progress.streak,
            hearts: progress.hearts,
          }}
          completedLessons={progress.completedLessons}
          heartsInfo={{
            seconds_until_next_heart: progress.secondsUntilNextHeart,
          }}
          mistakesCount={progress.mistakes.length}
          onSelectLesson={handleSelectLesson}
          onOpenPractice={() => setView('practice')}
        />
      )}

      {view === 'lesson' && activeLesson && (
        <LessonScreen
          lesson={activeLesson}
          user={{
            first_name: studentName,
            xp: progress.points,
            streak_days: progress.streak,
            hearts: progress.hearts,
          }}
          userProgress={progress}
          onFinish={handleFinishLesson}
          onExit={() => {
            setView('roadmap');
            refreshProgress();
          }}
          onOpenPractice={() => setView('practice')}
        />
      )}

      {view === 'practice' && (
        <PracticeMode
          user={{
            first_name: studentName,
            xp: progress.points,
            streak_days: progress.streak,
            hearts: progress.hearts,
          }}
          mistakeIds={progress.mistakes}
          onExit={() => {
            setView('roadmap');
            refreshProgress();
          }}
          onHeartsUpdated={(newHearts) => {
            setProgress((prev) => ({ ...prev, hearts: newHearts }));
          }}
        />
      )}

      {view === 'completion' && completionData && (
        <CompletionScreen
          xpEarned={completionData.xpEarned}
          accuracy={completionData.accuracy}
          streak={completionData.streak}
          streakIncremented={completionData.streakIncremented}
          onRetry={handleRetryLesson}
          onContinue={() => {
            setView('roadmap');
            setActiveLesson(null);
            setCompletionData(null);
            refreshProgress();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
