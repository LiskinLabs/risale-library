# Risale AI Studio — Comprehensive Brand & Feature Prompt

## 🎯 Миссия и Бренд
- **Название проекта:** Risale AI Studio (также известен как NurSpace / Risale AI Studio)
- **Владелец:** LiskinLabs (Silvestr Liskin)
- **Репозиторий:** github.com/LiskinLabs/risale-ai-studio
- **Слоган:** Кроссплатформенная библиотека для глубокого изучения Рисале-и Нур
- **Миссия:** Создание безупречной цифровой экосистемы для изучения наследия Саида Нурси. Премиальный книжный дизайн (Editorial UI) + передовые технологии.
- **Лицензия:** AGPL-3.0
- **Язык:** Русский (основной), многоязычная поддержка (i18next)

---

## 🏗️ Архитектура и Технологический Стек

### Frontend
- **Next.js 16** (App Router) с Turbopack
- **React 19.2** (строгий режим)
- **TypeScript 5** (strict mode, target ES2022, без `any`)
- **Tailwind CSS 3 + DaisyUI 4** — кастомная палитра "Midnight/Ivory/Gold"
- **CSS 3D Book Covers** — реалистичные 3D обложки с текстурой страниц и золотой окантовкой
- **Radix UI** — primitives (dialog, dropdown, select, tabs, tooltip, etc.)
- **DnD Kit** — drag & drop для организации книг
- **Lucide React + React Icons** — иконки
- **OverlayScrollbars** — кастомные скроллбары
- **React Virtuoso / react-window** — виртуализация для больших списков
- **react-markdown + remark-gfm** — рендеринг Markdown
- **streamdown** — стриминг Markdown для AI чата

### Десктоп и Мобайл
- **Tauri 2** (Rust) — кроссплатформенный десктоп
- **Tauri Plugins:** fs, http, shell, dialog, updater, websocket, deep-link, haptics, os, process, opener, log, cli, oauth
- **Rust-бэкенд (src-tauri/):** сканирование директорий (dir_scanner), Discord Rich Presence, Apple Auth, Safari Auth, Traffic Light позиционирование (macOS), E-ink оптимизация (Android), файловый трансфер

### База данных и Синхронизация
- **Turso (libSQL)** — SQLite-совместимая распределенная БД с векторами
- **Supabase** — Auth + Realtime синхронизация
- **S3-совместимое хранилище (MinIO / Cloudflare R2)** — хранение книг и ассетов
- **IndexedDB** — локальное хранение (с автоочисткой битых данных v4)

### AI и NLP
- **Google Gemini** — основной AI провайдер
- **OpenAI-совместимые провайдеры** (DeepSeek, OpenRouter, Ollama, любой HTTP)
- **AI SDK (`ai` v6 + `@ai-sdk/react`)** — фреймворк для AI-интеграций
- **Assistant UI (`@assistant-ui/react`)** — UI компоненты для AI чата
- **RAG (Retrieval Augmented Generation)** — поиск по контексту книги с чанками
- **AIGateway** — прокси-гейтвей для AI провайдеров с retry и failover

### Пакетный менеджер и монорепо
- **pnpm 11** (workspace)
- **Monorepo структура:** apps/*, packages/*, docker/*, data/*
- **Rust workspace:** src-tauri, tauri, tauri-plugins, qcms
- **Biome** — форматирование и линтинг (замена ESLint/Prettier)
- **Husky + lint-staged** — git hooks

### CI/CD и Деплой
- **Vercel** — веб-хостинг
- **Cloudflare Workers** (OpenNext) — serverless деплой
- **Docker/Podman** — self-hosting
- **GitHub Actions** — CI/CD
- **GitLab CI** — альтернативный CI

### Тестирование
- **Vitest 4** — unit/integration/browser тесты
- **Playwright** — e2e тесты (web)
- **WebDriverIO** — e2e тесты (desktop)
- **Lua тесты** — для KOReader плагина

---

## 📖 Основные Функциональные Модули

### 1. Чтение и Навигация (Reader Engine)
- **Мультиформатный движок:** EPUB, PDF, MOBI, TXT, CBZ (через foliate-js)
- **Параллельное чтение (Parallel View):** два текста бок о бок (оригинал + перевод)
- **Режим скорочтения (RSVP):** Rapid Serial Visual Presentation с настраиваемой скоростью
- **Линейка чтения (Reading Ruler):** подсветка строк для фокусировки
- **Непрерывная прокрутка (Continuous Scroll):** без разрывов страниц
- **Навигация по сноскам:** всплывающие popover с историей переходов
- **CFI (Canonical Fragment Identifier):** точное позиционирование в EPUB
- **Paginator:** продвинутая пагинация с колонками
- **Режимы отображения:** single page, double page, scroll
- **Фиксированный лэйаут (Fixed Layout):** для иллюстрированных книг
- **Глобальные выделения:** аннотации на все вхождения фрагмента
- **Лупа при выделении (Selection Magnifier):** увеличительное стекло

### 2. AI Ассистент (AI Chat / Assistant)
- **Chat с AI о книге:** контекстный диалог с пониманием содержимого
- **RAG-поиск:** чанкинг текста + поиск релевантных фрагментов
- **AI-перевод:** Gemini/DeepSeek/OpenRouter перевод выделенного текста
- **Объяснение контекста:** AI понимает терминологию Рисале-и Нур
- **Стриминг ответов:** через streamdown
- **Поддерживаемые провайдеры:** Gemini, DeepSeek, OpenRouter, Ollama, Custom HTTP
- **Прокси-гейтвей:** отказоустойчивость с retry

### 3. Аннотации и Заметки (Annotations)
- **Множество стилей выделения:** настраиваемые цвета и имена
- **Закладки + Заметки:** текстовая заметка к любому выделению
- **Глобальные выделения:** автоматическое выделение всех вхождений
- **Экспорт аннотаций:** plain text, Readwise
- **Readwise интеграция:** двухсторонняя синхронизация аннотаций
- **Notebook (Записная книжка):** сводка всех аннотаций и заметок

### 4. Управление Библиотекой (Library)
- **Встроенная библиотека Рисале-и Нур:** полная коллекция текстов
- **Группировка книг:** по авторам, сериям, категориям, тегам
- **Импорт книг:** пакетный, с фильтрацией по формату и размеру
- **OPDS интеграция:** подключение к OPDS-каталогам, авто-загрузка
- **Внешние папки:** чтение книг без копирования в библиотеку
- **Drag & Drop:** организация книг перетаскиванием
- **Поиск по библиотеке:** Orama (сверхбыстрый полнотекстовый поиск) + Lunr (fallback)
- **Метаданные:** Google Books API, OpenLibrary API авто-заполнение
- **Редактирование метаданных:** BookDetailEdit, SourceSelector
- **3D Обложки:** CSS 3D BookCover с текстурой страниц
- **Текстурный фон:** "Premium Grain" + кастомные текстуры

### 5. Словарь (Lügat / Dictionary)
- **Мгновенный поиск:** tap по слову — определение + перевод
- **MDict и StarDict:** парсинг словарей через js-mdict
- **Системные словари:** macOS/iOS/Android встроенные
- **Wikipedia интеграция:** быстрый доступ к энциклопедии
- **Smart Highlights:** авто-подсветка османских/арабских терминов
- **Китайский словарь (jieba):** сегментация и поиск

### 6. Синхронизация (Sync)
- **Кроссплатформенная синхронизация:** прогресс, заметки, закладки через Supabase + Turso
- **KOReader синхронизация:** полная интеграция (библиотека, закладки, аннотации)
- **KOReader плагин (Lua):** syncannotations, syncconfig, syncauth, supabaseauth
- **Hardcover.app интеграция:** отслеживание прогресса чтения через GraphQL API
- **Cloud Storage (S3):** синхронизация файлов книг
- **Backup Service:** резервное копирование данных

### 7. Text-to-Speech (TTS)
- **Web Speech API** (веб)
- **Edge TTS** (Windows)
- **Native TTS** (macOS/iOS/Android)
- **TTS Controller:** управление скоростью, голосом, подсветка читаемого предложения
- **TTS Highlight Styles:** настройка стиля подсветки
- **Арабские голоса:** поддержка RTL озвучки

### 8. Доступность и Удобство (Accessibility & UX)
- **Тёмная тема:** полноценная с настройкой цветов
- **E-ink режим:** оптимизация для электронных чернил (Android)
- **Настраиваемые шрифты:** пользовательские шрифты с синхронизацией
- **Режим фокусировки:** минималистичный интерфейс
- **Command Palette (cmd+k):** быстрый доступ ко всем функциям
- **Keyboard shortcuts:** полная настройка горячих клавиш
- **Gamepad support:** чтение с геймпада
- **Screen Wake Lock:** предотвращение засыпания экрана при чтении
- **Pull to Refresh:** мобильный жест обновления
- **Swipe to Dismiss:** мобильный жест закрытия
- **Safe Area Insets:** поддержка notch/cutout
- **Responsive Design:** адаптация под все размеры экрана
- **Traffic Light позиционирование:** нативный UI macOS

### 9. Безопасность (Security)
- **PIN-блокировка:** опциональная 4-значная блокировка при запуске
- **Изолированный рендеринг:** sandboxed iframe для контента
- **HTTPS/TLS:** весь синхронизационный трафик зашифрован
- **Supabase Auth:** OAuth (Google, Apple, Email)
- **Apple Auth:** нативная авторизация через macOS/iOS
- **Safari Auth:** веб-авторизация через Safari

### 10. Монетизация и Платежи
- **Stripe интеграция:** подписки и платежи
- **Plans:** available plans hook
- **Quota system:** отслеживание использования AI-функций

### 11. Десктопные функции
- **Discord Rich Presence:** отображение читаемой книги в Discord
- **Auto-updater:** авто-обновление десктопного приложения
- **File Association:** открытие книг из файлового менеджера
- **Tauri Deep Links:** deep linking для OAuth/внешних ссылок
- **Traffic Light Buttons:** кастомные кнопки окна (macOS)
- **About Window:** информация о приложении

### 12. Браузерное расширение (Browser Extension)
- **Send to Risale AI Studio:** отправка веб-страниц в приложение
- **Readability (Mozilla):** извлечение чистого текста из веб-страниц

### 13. PWA и Оффлайн
- **Serwist (PWA):** агрессивное кэширование книг и шрифтов
- **Offline страница:** полноценная работа без интернета
- **Service Worker:** фоновое кэширование

### 14. Локализация (i18n)
- **i18next:** полная мультиязычность
- **i18next-scanner:** автоматическое извлечение строк для перевода
- **Поддержка RTL:** для арабского текста

### 15. Аналитика
- **PostHog:** аналитика использования
- **Google Auth Library:** OAuth интеграции

---

## 📁 Структура Проекта

```
risale-ai-studio/
├── apps/
│   ├── readest-app/              # Основное Next.js + Tauri приложение
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router страницы
│   │   │   │   ├── api/          # API routes
│   │   │   │   ├── auth/         # Авторизация
│   │   │   │   ├── library/      # Библиотека
│   │   │   │   ├── reader/       # Читалка
│   │   │   │   ├── opds/         # OPDS каталог
│   │   │   │   ├── user/         # Профиль пользователя
│   │   │   │   ├── updater/      # Обновление
│   │   │   │   └── offline/      # Оффлайн режим
│   │   │   ├── components/       # React компоненты
│   │   │   │   ├── assistant/    # AI ассистент
│   │   │   │   ├── settings/     # Настройки (цвет, шрифты, TTS, AI, лэйаут)
│   │   │   │   ├── metadata/     # Редактор метаданных книг
│   │   │   │   ├── command-palette/ # Командная палитра
│   │   │   │   └── primitives/   # Radix UI обертки
│   │   │   ├── services/         # Бизнес-логика
│   │   │   │   ├── ai/           # AI провайдеры и RAG
│   │   │   │   ├── annotation/   # Аннотации
│   │   │   │   ├── database/     # База данных (Web/Native/Node)
│   │   │   │   ├── dictionaries/ # Словари
│   │   │   │   ├── hardcover/    # Hardcover.app интеграция
│   │   │   │   ├── metadata/     # Метаданные (Google Books, OpenLibrary)
│   │   │   │   ├── nav/          # Навигация по книге
│   │   │   │   ├── readwise/     # Readwise интеграция
│   │   │   │   ├── rsvp/         # Скорочтение RSVP
│   │   │   │   ├── sync/         # Синхронизация
│   │   │   │   ├── transformers/ # Трансформеры контента
│   │   │   │   ├── translators/  # Переводчики (AI, Azure, DeepL, Google, Yandex)
│   │   │   │   └── tts/          # Text-to-Speech
│   │   │   ├── hooks/            # React хуки (32 хука)
│   │   │   ├── store/            # Zustand сторы (15 сторов)
│   │   │   ├── libs/             # Библиотеки
│   │   │   ├── types/            # TypeScript типы
│   │   │   └── utils/            # Утилиты
│   │   ├── src-tauri/            # Rust бэкенд
│   │   ├── extensions/           # Браузерное расширение
│   │   └── workers/              # Cloudflare Workers
│   └── readest.koplugin/         # KOReader плагин (Lua)
├── packages/
│   ├── foliate-js/               # Движок рендеринга книг
│   ├── js-mdict/                 # Парсер MDict словарей
│   ├── tauri/                    # Форк Tauri
│   └── tauri-plugins/            # Плагины Tauri
├── docker/                       # Docker/Podman конфигурации
├── data/                         # Метаданные, скриншоты, иконки
├── ops/                          # Nix конфигурации
├── scripts/                      # Скрипты (cleanup, catalog)
├── patches/                      # pnpm патчи
└── public/                       # Статические файлы
```

---

## 🎨 Дизайн-система

### Цветовая палитра "Midnight/Ivory/Gold"
- **Тёмная тема:** глубокий midnight blue фон
- **Светлая тема:** ivory/кремовый фон
- **Акценты:** золотые элементы (бордюры, обложки)
- **Текстура:** "Premium Grain" шум по всему фону

### Типографика
- **Заголовки:** Playfair Display (премиальные/эдиториальные)
- **Основной текст:** Lora (serif для чтения)
- **UI:** Inter (sans-serif для интерфейса)
- **Арабский:** Amiri (RTL поддержка)
- **Google Fonts через next/font**

### UI Эффекты
- **Glassmorphism:** матовое стекло для панелей (premium-glass)
- **Кинематографичные переходы:** плавные анимации между состояниями
- **View Transitions API:** next-view-transitions
- **3D CSS:** реалистичные обложки книг с глубиной

---

## 🔧 Dev Experience

### Команды (monorepo корень)
| Команда | Описание |
|---|---|
| `pnpm dev-web` | Web разработка |
| `pnpm tauri dev` | Десктоп разработка |
| `pnpm test` | Все тесты |
| `pnpm lint` | Линтинг TypeScript + Lua |
| `pnpm format` | Форматирование Biome |
| `pnpm build-web` | Сборка Web |
| `pnpm tauri build` | Сборка десктопа |

### Требования
- Node.js v24+, pnpm v11+
- Rust + Cargo (для Tauri)
- Supabase проект
- Turso БД
- Google Gemini API Key

### Платформы
- **macOS 12.0+** (Universal: Intel + Apple Silicon)
- **Windows 10/11** (x64 + ARM64)
- **Linux** (AppImage)
- **Android 8.0+** (APK + Google Play)
- **iOS 15.0+** (App Store)
- **Web** (Vercel / Cloudflare / Self-hosting)

---

## 🔗 Внешние интеграции
- **Supabase:** Auth + Database + Storage
- **Turso:** распределенная SQLite (Edge)
- **Stripe:** платежи
- **Google Gemini:** AI
- **Google Books:** метаданные
- **OpenLibrary:** метаданные
- **Readwise:** синхронизация аннотаций
- **Hardcover.app:** отслеживание чтения
- **DeepL:** перевод
- **Azure Translator:** перевод
- **Yandex Translator:** перевод
- **OPDS:** каталоги книг
- **Discord:** Rich Presence
- **PostHog:** аналитика
- **S3 (MinIO/R2):** файловое хранилище
- **GitHub Pages:** статический хостинг

---

*Сгенерировано 2026-06-01 для полной пересборки проекта risale-ai-studio. Содержит все функции, бренд и архитектурные решения.*
