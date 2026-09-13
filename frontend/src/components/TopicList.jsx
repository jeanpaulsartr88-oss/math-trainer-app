import React, { useMemo } from 'react';
import { Sparkles, Check, Play, Flame, Zap, Heart, Clock, ChevronRight, Sun, Moon, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { getFallbackTopics } from '../data/curriculumFallback';

export default function TopicList({
  topics = [],
  user,
  completedLessons = [],
  heartsInfo,
  mistakesCount = 0,
  onSelectLesson,
  onOpenPractice,
}) {
  const { isDark, toggleTheme } = useTheme();
  const currentHearts = user?.hearts ?? 5;
  const secondsToNext = heartsInfo?.seconds_until_next_heart || 0;
  const hours = Math.floor(secondsToNext / 3600);
  const minutes = Math.floor((secondsToNext % 3600) / 60);

  // Guarantee topics are never empty: if prop is empty, use instant offline fallback
  const displayTopics = useMemo(() => {
    if (Array.isArray(topics) && topics.length > 0) {
      return topics;
    }
    return getFallbackTopics();
  }, [topics]);

  // Completed lessons lookup map: lesson_id -> { lesson_id, mastery_rate }
  const completedMap = useMemo(() => {
    const map = new Map();
    (completedLessons || []).forEach((item) => {
      map.set(Number(item.lesson_id), item);
    });
    return map;
  }, [completedLessons]);

  return (
    <div className="min-h-[100dvh] w-full max-w-md mx-auto flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Sticky User Profile Top Bar */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-base shadow-xs">
              {user?.first_name?.charAt(0) || 'У'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight">
                  {user?.first_name || 'Ученик'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>{user?.xp || 0} XP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak */}
            <div className="flex items-center gap-1 font-bold text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800/50">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{user?.streak_days || 0}</span>
            </div>

            {/* Hearts (Informational Indicator) */}
            <div className="flex items-center gap-1 font-bold text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-lg border border-rose-200/80 dark:border-rose-800/50">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>{currentHearts}</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors active:scale-95 cursor-pointer"
              aria-label="Переключить тему"
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* Passive recharge timer info */}
        {currentHearts < 5 && secondsToNext > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>
                Восстановление: {hours > 0 ? `${hours}ч ` : ''}{minutes}м
              </span>
            </div>
            <button
              onClick={onOpenPractice}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
            >
              Практика (+1 ❤️) →
            </button>
          </div>
        )}
      </header>

      {/* Main Scrollable Syllabus Content */}
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="flex flex-col gap-6 p-4">
          {/* Баннер повторения ошибок (компактный) */}
          <div
            onClick={onOpenPractice}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white shadow-sm cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Практикум над ошибками</h4>
                <p className="text-xs text-blue-100">
                  {mistakesCount > 0
                    ? `Ошибок на повторение: ${mistakesCount}`
                    : 'Свободная тренировка по всем темам'}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold bg-white/20 px-2.5 py-1 rounded-lg">
              +1 ❤️
            </span>
          </div>

          {/* Основной академический каталог (ВСЕГДА ВИДЕН) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Учебные модули
              </h2>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                {displayTopics.length} темы · 8 уроков
              </span>
            </div>

            {displayTopics.map((topic, topicIdx) => {
              const completedCount = topic.lessons?.filter((l) => completedMap.has(Number(l.id))).length || 0;
              const totalCount = topic.lessons?.length || 0;

              return (
                <div
                  key={topic.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors duration-200"
                >
                  {/* Module Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-mono text-xs font-bold">
                        {topicIdx + 1}
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {topic.title}
                      </h3>
                    </div>

                    <div className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                      {completedCount}/{totalCount}
                    </div>
                  </div>

                  {/* Lessons List: Infinite retries allowed, always open! */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {topic.lessons?.map((lesson) => {
                      const completedRecord = completedMap.get(Number(lesson.id));
                      const isCompleted = Boolean(completedRecord);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson({ ...lesson, topic_slug: topic.slug, topic_title: topic.title }, topic)}
                          className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                          title={isCompleted ? "Пройти повторно" : "Начать урок"}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors ${
                                isCompleted
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              ) : (
                                <Play className="w-3 h-3 fill-current translate-x-0.5" />
                              )}
                            </div>

                            <div>
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug flex items-center gap-2">
                                <span>{lesson.title}</span>
                                {isCompleted && completedRecord?.mastery_rate !== undefined && (
                                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                                    {completedRecord.mastery_rate}%
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>+{lesson.xp_reward} XP · {lesson.question_count || 5} задач</span>
                                {isCompleted && (
                                  <span className="text-slate-400 dark:text-slate-500 flex items-center gap-0.5 text-[10px]">
                                    <RotateCcw className="w-2.5 h-2.5" /> повторить
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
