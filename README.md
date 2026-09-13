# 🦉 Math Duolingo — Telegram Mini App (TMA) LMS

Полнофункциональный математический образовательный тренажёр в формате **Duolingo**, разработанный специально для **Telegram Mini Apps (TMA)**. Включает адаптивную систему интервального повторения ошибок (Spaced Repetition), регенерацию сердец, ежедневные стрики, отрисовку формул через KaTeX, тактильные вибрации TMA Haptics и готов к мгновенному деплою на **Render (Free Tier)** с мониторингом через **UptimeRobot**.

---

## 🌟 Ключевые возможности

### 1. Duolingo Engine & Геймификация
- **Огонь дня (Daily Streak):**
  - Подсчёт дней непрерывных занятий в UTC / локальной таймзоне.
  - Первое занятие за день увеличивает стрик на `+1`. Повторные занятия в тот же день сохраняют стрик.
  - Пропуск дня сбрасывает стрик в `1`.
- **Система сердец (Hearts System):**
  - Максимум: 5 сердец.
  - Неправильный ответ отнимает 1 сердце и вызывает тактильный отклик ошибки `HapticFeedback.notificationOccurred('error')`.
  - При 0 сердец обычные уроки блокируются.
  - **Пассивная регенерация:** автоматическое восстановление +1 сердца каждые 4 часа.
  - **Режим практики над ошибками:** доступен всегда и при 0 сердец. За ошибки жизни **не** снимаются, а каждый верный ответ восстанавливает **+1 ❤️**!
- **Адаптивная очередь ошибок (Adaptive Error Loop):**
  - Ошибочный вопрос отправляется в конец текущей очереди урока (`activeQueue`).
  - Урок завершается только тогда, когда каждый ошибочный вопрос решён заново и верно.
  - В конце урока выводится First-Try Accuracy (точность с первого раза), начисленный XP, стрик и анимация конфетти.

### 2. Дидактика и KaTeX
- Отображение математических формул любой сложности: дроби ($\frac{a}{b}$), корни ($\sqrt{x}$), степени ($x^n$), уравнения и геометрия.
- Карточки с разбором: модальное пошаговое объяснение решения при неверном ответе.

### 3. Telegram Native Feel
- Интеграция с `@twa-dev/sdk` и `window.Telegram.WebApp`.
- Тактильные вибрации (Haptics) на успех, ошибку и выбор вариантов.
- Поддержка нативной кнопки «Назад» (`BackButton`).
- Блокировка скролл-баунса iOS и выделения текста (`select-none`).
- Встроенный Web Audio синтезатор Duolingo-звуков (не требует внешних файлов).
- **Режим разработки (Dev Mode):** возможность локальной разработки и тестирования в обычном браузере (Chrome / Edge / Firefox) без необходимости каждый раз открывать Telegram.

---

## 📂 Структура репозитория

```
math_lms/
├── backend/
│   ├── app.py                 # Flask REST API, SPA static serving, error handlers
│   ├── models.py              # SQLAlchemy: User, Topic, Lesson, Question, UserMistake
│   ├── config.py              # Конфигурация и переменные окружения
│   ├── auth.py                # Валидация Telegram initData (HMAC-SHA256) + Dev Mode
│   ├── engine.py              # Логика сердец, стриков и Spaced Repetition
│   ├── seed.py                # Начальная база математических вопросов с KaTeX
│   ├── requirements.txt       # Зависимости Python
│   └── tests/
│       └── test_engine.py     # Модульные тесты геймификации и API
├── frontend/
│   ├── index.html             # Точка входа с Telegram WebApp SDK и KaTeX CSS
│   ├── package.json           # React 18, Tailwind, Lucide, KaTeX, Confetti
│   ├── vite.config.js         # Конфигурация Vite с proxy на backend
│   ├── tailwind.config.js     # Палитра Duolingo (#58CC02, #1CB0F6, #FF4B4B, #FFC800)
│   └── src/
│       ├── App.jsx            # Главный координатор состояний
│       ├── api.js             # API клиент с передачей initData
│       ├── components/        # UI-компоненты (Header, QuestionCard, BottomSheet, etc.)
│       └── utils/             # Telegram SDK и процедурный звуковой движок
├── build.sh                   # Скрипт сборки для Render
├── render.yaml                # Render Blueprint (Free Tier)
├── Dockerfile                 # Мультистейдж Docker-образ
├── .env.example               # Образец настроек
└── README.md
```

---

## 🚀 Быстрый старт локально

### Шаг 1: Клонирование и настройка окружения
```bash
cd math_lms
cp .env.example .env
```

### Шаг 2: Запуск Backend (Python)
```bash
# Установка зависимостей
pip install -r backend/requirements.txt

# Запуск тестов для проверки
python -m unittest backend.tests.test_engine

# Запуск локального сервера Flask (порт 5001)
python -m backend.app
```
*При первом запуске база данных `math_app.db` создастся и наполнится математическими темами автоматически.*

### Шаг 3: Запуск Frontend (React Vite)
В отдельном окне терминала:
```bash
cd frontend
npm install
npm run dev
```
Откройте **[http://localhost:5002](http://localhost:5002)** в браузере. Вы увидите полноценный интерфейс тренажера с мок-пользователем `Тестовый Ученик`.

---

## 🤖 Регистрация Telegram Mini App в BotFather

1. Откройте диалог с **[@BotFather](https://t.me/BotFather)** в Telegram.
2. Создайте бота:
   - Отправьте команду `/newbot`
   - Введите имя (например, `Math Hero LMS`) и юзернейм (например, `MathHeroDuolingoBot`)
   - Скопируйте полученный **API Token** в `.env` (`BOT_TOKEN=...`).
3. Создайте Mini App:
   - Отправьте `/newapp`
   - Выберите созданного бота
   - Введите заголовок (например, `Математический тренажёр`)
   - Введите краткое описание
   - Загрузите иконку (640x360 px)
   - В поле **Web App URL** укажите URL вашего деплоя на Render (например, `https://math-lms-duolingo-tma.onrender.com`).
   - Укажите короткое имя приложения (short name), например `app`.
4. Настройте кнопку меню в боте:
   - Отправьте `/setmenubutton` -> выберите бота -> укажите URL приложения.

---

## ☁️ Деплой на Render (Free Tier)

### Вариант А: Автоматический деплой через Render Blueprint (`render.yaml`)
1. Загрузите репозиторий на GitHub.
2. В панели [Render Dashboard](https://dashboard.render.com/) нажмите **New +** -> **Blueprint**.
3. Выберите ваш репозиторий. Render автоматически обнаружит `render.yaml` и настроит сервис.
4. В разделе переменных укажите:
   - `BOT_TOKEN`: токен вашего бота из @BotFather
   - `DEV_MODE`: `false`

### Вариант Б: Ручная настройка Web Service
1. Создайте **New Web Service** на Render и подключите GitHub-репозиторий.
2. Настройки:
   - **Environment:** `Python 3`
   - **Region:** `Frankfurt (EU Central)`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn -w 2 -b 0.0.0.0:$PORT "backend.app:app"`
   - **Health Check Path:** `/healthz`
3. Добавьте переменные окружения:
   - `BOT_TOKEN`: токен бота Telegram
   - `DEV_MODE`: `false`
   - `SECRET_KEY`: случайная секретная строка

Скрипт `build.sh` автоматически соберёт React в директорию `backend/static/`, а Flask будет отдавать готовое SPA-приложение и обрабатывать REST API на едином порту `$PORT`.

---

## ⏰ Предотвращение засыпания (UptimeRobot Keep-Alive)

Бесплатный тариф Render (Free Tier) усыпляет инстанс при отсутствии активности более 15 минут. Чтобы мини-апп открывался мгновенно без 50-секундной задержки холодного старта:

1. Зарегистрируйтесь бесплатно на [UptimeRobot.com](https://uptimerobot.com/).
2. Нажмите **Add New Monitor**.
3. Выберите параметры:
   - **Monitor Type:** `HTTP(s)`
   - **Friendly Name:** `Math TMA LMS`
   - **URL (or IP):** `https://ваш-домен.onrender.com/healthz`
   - **Monitoring Interval:** `5 minutes`
4. Нажмите **Create Monitor**.

Эндпоинт `GET /healthz` возвращает `200 OK` моментально, без нагрузки на базу данных, гарантируя постоянную активность контейнера 24/7.
