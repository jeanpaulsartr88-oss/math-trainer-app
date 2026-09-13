import questionsRawData from './questions_data.json';

/**
 * Parses the local JSON seed into structured topics, lessons, and questions.
 * Serves as 100% offline fallback if backend or Render is asleep/unreachable.
 */
let cachedTopics = null;
let questionsById = new Map();
let lessonsById = new Map();

function buildLocalCatalog() {
  if (cachedTopics) return cachedTopics;

  let lessonIdCounter = 1;
  let questionIdCounter = 1;
  const topics = [];

  for (let tIdx = 0; tIdx < questionsRawData.length; tIdx++) {
    const rawTopic = questionsRawData[tIdx];
    const topicId = tIdx + 1;

    const topic = {
      id: topicId,
      slug: rawTopic.topic_slug || `topic-${topicId}`,
      title: rawTopic.topic_title || `Тема ${topicId}`,
      order_index: tIdx + 1,
      lessons: [],
    };

    for (let lIdx = 0; lIdx < (rawTopic.lessons || []).length; lIdx++) {
      const rawLesson = rawTopic.lessons[lIdx];
      const lessonId = lessonIdCounter++;

      const questions = (rawLesson.questions || []).map((q) => {
        const qId = questionIdCounter++;
        const questionObj = {
          id: qId,
          lesson_id: lessonId,
          latex_text: q.latex_text,
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: q.correct_answer,
          explanation_latex: q.explanation || '',
        };
        questionsById.set(qId, questionObj);
        return questionObj;
      });

      const lesson = {
        id: lessonId,
        topic_id: topicId,
        title: rawLesson.lesson_title || `Урок ${lessonId}`,
        order_index: rawLesson.order || lIdx + 1,
        xp_reward: 20,
        question_count: questions.length,
        questions,
      };

      lessonsById.set(lessonId, lesson);
      topic.lessons.push(lesson);
    }

    topics.push(topic);
  }

  cachedTopics = topics;
  return cachedTopics;
}

export function getFallbackTopics() {
  return buildLocalCatalog();
}

export function getFallbackLesson(lessonId) {
  buildLocalCatalog();
  const id = Number(lessonId);
  return lessonsById.get(id) || null;
}

export function getFallbackLessonQuestions(lessonId) {
  const lesson = getFallbackLesson(lessonId);
  return lesson ? lesson.questions : [];
}

export function getFallbackPracticeQuestions(mistakeIds = []) {
  buildLocalCatalog();
  const requested = [];
  const seenIds = new Set();

  // 1. Pick questions by mistake IDs
  (mistakeIds || []).forEach((mId) => {
    const q = questionsById.get(Number(mId));
    if (q && !seenIds.has(q.id)) {
      requested.push(q);
      seenIds.add(q.id);
    }
  });

  // 2. If fewer than 10 questions, supplement with random questions from the database
  if (requested.length < 10) {
    const allQuestions = Array.from(questionsById.values());
    const remaining = allQuestions.filter((q) => !seenIds.has(q.id));
    // Shuffle remaining
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
    }
    const needed = 10 - requested.length;
    remaining.slice(0, needed).forEach((q) => requested.push(q));
  }

  return requested.slice(0, 10);
}
