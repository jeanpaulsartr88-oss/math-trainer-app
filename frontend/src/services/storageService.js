/**
 * Unified Progress Storage Service for Telegram Mini App and Web Browser.
 * Prioritizes Telegram CloudStorage with parallel synchronization and fallback to localStorage.
 */

const REGEN_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours per heart
const MAX_HEARTS = 5;

export const storage = {
  async set(key, value) {
    const strValue = JSON.stringify(value);
    try {
      localStorage.setItem(key, strValue);
    } catch (e) {
      console.warn('LocalStorage setItem failed:', e);
    }

    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.CloudStorage) {
      window.Telegram.WebApp.CloudStorage.setItem(key, strValue, (err) => {
        if (err) console.warn('CloudStorage setItem error:', err);
      });
    }
  },

  async get(key, defaultValue = null) {
    // 1. Try Telegram CloudStorage if available
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.CloudStorage) {
      try {
        const cloudResult = await new Promise((resolve) => {
          window.Telegram.WebApp.CloudStorage.getItem(key, (err, val) => {
            if (!err && val) {
              try {
                resolve(JSON.parse(val));
              } catch (parseErr) {
                resolve(defaultValue);
              }
            } else {
              try {
                const local = localStorage.getItem(key);
                resolve(local ? JSON.parse(local) : defaultValue);
              } catch (e) {
                resolve(defaultValue);
              }
            }
          });
        });
        if (cloudResult !== null && cloudResult !== undefined) {
          return cloudResult;
        }
      } catch (e) {
        // Fallback to localStorage
      }
    }

    // 2. Direct localStorage fallback
    try {
      const local = localStorage.getItem(key);
      return local ? JSON.parse(local) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }
};

function getIsoDate(dateObj = new Date()) {
  return dateObj.toISOString().slice(0, 10);
}

export const storageService = {
  async getProgress() {
    const [streak, lastActiveDate, completedLessons, points, mistakes, hearts, lastHeartTimestamp] = await Promise.all([
      storage.get('math_streak', 0),
      storage.get('math_last_active_date', null),
      storage.get('math_completed_lessons', []),
      storage.get('math_points', 0),
      storage.get('math_mistakes', []),
      storage.get('math_hearts', MAX_HEARTS),
      storage.get('math_last_heart_timestamp', null),
    ]);

    const heartsSync = this.calculateHeartsRegen(hearts, lastHeartTimestamp);
    if (heartsSync.updated) {
      await storage.set('math_hearts', heartsSync.hearts);
      await storage.set('math_last_heart_timestamp', heartsSync.lastHeartTimestamp);
    }

    return {
      streak: Number(streak) || 0,
      lastActiveDate,
      completedLessons: Array.isArray(completedLessons) ? completedLessons : [],
      points: Number(points) || 0,
      mistakes: Array.isArray(mistakes) ? mistakes : [],
      hearts: heartsSync.hearts,
      lastHeartTimestamp: heartsSync.lastHeartTimestamp,
      secondsUntilNextHeart: heartsSync.secondsUntilNextHeart,
    };
  },

  calculateHeartsRegen(currentHearts, lastTimestamp) {
    let hearts = Math.min(MAX_HEARTS, Math.max(0, Number(currentHearts) ?? MAX_HEARTS));
    let lastHeartTimestamp = lastTimestamp ? Number(lastTimestamp) : null;
    let updated = false;

    if (hearts >= MAX_HEARTS) {
      return { hearts: MAX_HEARTS, lastHeartTimestamp: null, secondsUntilNextHeart: 0, updated: lastHeartTimestamp !== null };
    }

    if (!lastHeartTimestamp) {
      lastHeartTimestamp = Date.now();
      updated = true;
    }

    const elapsed = Date.now() - lastHeartTimestamp;
    const restored = Math.floor(elapsed / REGEN_INTERVAL_MS);

    if (restored > 0) {
      hearts = Math.min(MAX_HEARTS, hearts + restored);
      updated = true;
      if (hearts >= MAX_HEARTS) {
        lastHeartTimestamp = null;
      } else {
        lastHeartTimestamp += restored * REGEN_INTERVAL_MS;
      }
    }

    const secondsUntilNextHeart = hearts < MAX_HEARTS && lastHeartTimestamp
      ? Math.max(0, Math.ceil((REGEN_INTERVAL_MS - ((Date.now() - lastHeartTimestamp) % REGEN_INTERVAL_MS)) / 1000))
      : 0;

    return { hearts, lastHeartTimestamp, secondsUntilNextHeart, updated };
  },

  async saveLessonResult({ lessonId, xpEarned = 20, accuracy = 100, failedQuestionIds = [], heartsLost = 0 }) {
    const current = await this.getProgress();

    const newPoints = current.points + Number(xpEarned);
    await storage.set('math_points', newPoints);

    const existingIndex = current.completedLessons.findIndex((item) => item.lesson_id === lessonId);
    const updatedCompleted = [...current.completedLessons];
    const lessonRecord = {
      lesson_id: lessonId,
      mastery_rate: Math.max(accuracy, existingIndex >= 0 ? (updatedCompleted[existingIndex].mastery_rate || 0) : 0),
      completed_at: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      updatedCompleted[existingIndex] = lessonRecord;
    } else {
      updatedCompleted.push(lessonRecord);
    }
    await storage.set('math_completed_lessons', updatedCompleted);

    const today = getIsoDate();
    const yesterday = getIsoDate(new Date(Date.now() - 86400000));
    let newStreak = current.streak;
    let streakIncremented = false;

    if (current.lastActiveDate === today) {
      streakIncremented = false;
    } else if (current.lastActiveDate === yesterday) {
      newStreak += 1;
      streakIncremented = true;
    } else {
      newStreak = 1;
      streakIncremented = true;
    }
    await storage.set('math_streak', newStreak);
    await storage.set('math_last_active_date', today);

    const mistakeSet = new Set(current.mistakes);
    failedQuestionIds.forEach((id) => mistakeSet.add(id));
    const updatedMistakes = Array.from(mistakeSet);
    await storage.set('math_mistakes', updatedMistakes);

    let newHearts = Math.max(0, current.hearts - heartsLost);
    let newLastHeartTimestamp = current.lastHeartTimestamp;
    if (newHearts < MAX_HEARTS && !newLastHeartTimestamp) {
      newLastHeartTimestamp = Date.now();
    }
    await storage.set('math_hearts', newHearts);
    await storage.set('math_last_heart_timestamp', newLastHeartTimestamp);

    return {
      points: newPoints,
      streak: newStreak,
      streakIncremented,
      completedLessons: updatedCompleted,
      mistakes: updatedMistakes,
      hearts: newHearts,
    };
  },

  async resolvePracticeQuestion(questionId, isCorrect) {
    const current = await this.getProgress();
    let { hearts, lastHeartTimestamp, mistakes } = current;
    let heartRecovered = false;

    if (isCorrect) {
      mistakes = mistakes.filter((id) => id !== questionId);
      await storage.set('math_mistakes', mistakes);

      if (hearts < MAX_HEARTS) {
        hearts += 1;
        heartRecovered = true;
        if (hearts >= MAX_HEARTS) {
          lastHeartTimestamp = null;
        }
        await storage.set('math_hearts', hearts);
        await storage.set('math_last_heart_timestamp', lastHeartTimestamp);
      }
    }

    return {
      success: true,
      hearts,
      heartRecovered,
      mistakes,
    };
  }
};
