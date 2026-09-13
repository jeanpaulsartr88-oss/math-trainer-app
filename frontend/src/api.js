import {
  getFallbackTopics,
  getFallbackLesson,
  getFallbackLessonQuestions,
  getFallbackPracticeQuestions,
} from './data/curriculumFallback';

const API_BASE = '';

async function request(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Ошибка сети');
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  // Public syllabus curriculum with instant JSON offline fallback
  getTopics: async () => {
    try {
      const data = await request('/api/topics');
      if (Array.isArray(data.topics) && data.topics.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Network request failed, activating offline curriculum fallback:', e);
    }
    // Fallback: 105 questions across 4 topics from local questions_data.json
    return { topics: getFallbackTopics() };
  },

  // Public lesson questions with instant fallback
  getLesson: async (lessonId) => {
    try {
      const data = await request(`/api/lesson/${lessonId}`);
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn(`Network request for lesson ${lessonId} failed, using local fallback:`, e);
    }
    const lesson = getFallbackLesson(lessonId);
    const questions = getFallbackLessonQuestions(lessonId);
    return { lesson, questions };
  },

  startLesson: async (lessonId) => {
    return api.getLesson(lessonId);
  },

  // Public completion telemetry (non-blocking)
  completeLesson: (lessonId, stats) => request(`/api/lesson/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify(stats),
  }).catch(() => ({ status: 'ok' })),

  // Practice mode questions with instant fallback
  getPracticeQuestions: async (mistakeIds = []) => {
    const query = mistakeIds.length > 0 ? `?ids=${mistakeIds.slice(0, 10).join(',')}` : '';
    try {
      const data = await request(`/api/practice/questions${query}`);
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Practice questions request failed, using local fallback:', e);
    }
    return { questions: getFallbackPracticeQuestions(mistakeIds) };
  },

  getPracticeMistakes: (mistakeIds = []) => api.getPracticeQuestions(mistakeIds),

  // Practice answer submission (non-blocking)
  submitPracticeAnswer: (questionId, isCorrect) => request('/api/practice/answer', {
    method: 'POST',
    body: JSON.stringify({ question_id: questionId, is_correct: isCorrect }),
  }).catch(() => ({ status: 'ok', success: true })),
};
