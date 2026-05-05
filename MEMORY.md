# Project Memory: NurSpace Digital Library

## 🧠 Permanent Knowledge Base

### 🎯 Mission Statement

Создание безупречной цифровой экосистемы **NurSpace** для изучения наследия Саида Нурси. Приложение объединяет премиальный книжный дизайн (Editorial UI) и передовые технологии (CSS 3D, Next.js 16) для обеспечения глубокого и вдохновляющего опыта чтения.

### 🛠️ Technical Stack

- **Name:** NurSpace
- **Framework:** Next.js 16 (Turbopack).
- **Core UI:** CSS-Only 3D Visuals & Premium Typography.
- **Styling:** Custom "Midnight/Ivory" Palette with Grain Texture.

---

## 📜 Detailed Translation Mandate

**Роль:** Переводчик-богослов.

1. **Терминологическая честность:** Не упрощать смыслы. _Нафс_ (эго), _Хакикат_ (Истина), _Фикр_ (размышление), _Шукур_ (благодарность).
2. **Военная точность:** Военные аллегории переводить с дисциплиной и четкостью тактических инструкций.
3. **Благородный Avam Lisanı:** Простота без примитивности. Мудрость без гордыни.

---

## 🗺️ Project Execution Log

### Phase 1: Stabilization (Completed)

- [x] **ReferenceError Fix:** Исправлена ошибка `handleShowOPDSDialog is not defined` в `app/library/page.tsx`.
- [x] **Web Launch:** Приложение стабильно запускается на `localhost:3000`.
- [x] **Data Integrity:** Устранены 30 ошибок 404. Пути в `risale.json` синхронизированы с реальными файлами (напр. `ru_mektubat.md`).
- [x] **Converter Recovery:** Исправлен критический сбой и двойное экранирование тегов в `txt.ts`.
- [x] **Clean IndexedDB:** Реализована автоматическая очистка базы данных (v4) от поврежденных EPUB-файлов.
- [x] **Semantic Risale Layout:** Реализована безупречная верстка: подписи автора справа, центрированные заголовки `<...>`, стилизованные примечания `[...]`, арабские блоки с RTL.
- [x] **Professional TOC:** Оглавление полностью текстовое, подгружается из `metadata.json` с помощью мульти-ключевого поиска.
- [x] **Script Cleanup:** Удалено 15 устаревших скриптов импорта (v1-v6), папка `scripts/` очищена от мусора.
- [x] **Dependencies Update:** Обновлены ключевые dev-зависимости (TypeScript 6.0.3, Biome 2.4.13, Prettier 3.8.3). Мигрирована конфигурация Biome.

### Phase 2: Premium UI/UX Design Overhaul (Completed)

- [x] **3D CSS Book Covers:** Реализована уникальная система отрисовки обложек: каждая книга — это 3D-объект с реалистичной толщиной, текстурой страниц и золотой окантовкой.
- [x] **Typography Foundation:** Интегрированы Google Fonts (Lora, Inter, Playfair Display, Amiri) через `next/font`.
- [x] **Premium Color Palette:** Внедрена кастомная палитра "Midnight/Ivory/Gold" в `tailwind.config.ts`.
- [x] **Texture & Atmosphere:** Добавлена текстура "Premium Grain" и плавные кинематографичные переходы в `globals.css`.
- [x] **Editorial Catalog:** Полностью переработана верстка `Bookshelf.tsx` в стиле классических книжных полок с воздушной сеткой и мягкими hover-эффектами. Использованы шрифты Playfair Display для заголовков категорий.
- [x] **Glassmorphism:** Все интерфейсные панели (плеер, словарь, категории) используют эффект матового стекла (`premium-glass`).
- [x] **Performance & Visibility Fix:** Исправлена критическая проблема исчезновения демо-книг. Теперь библиотека объединяет локальные и демо-книги мгновенно. Оптимизирована инициализация `initLibrary` для моментального отображения контента.

### Phase 3: Intelligent Engine & Global Scale (In Progress)

- [x] **Orama Search Integration:** Устаревший Lunr заменен на сверхбыстрый движок Orama. Мгновенный полнотекстовый поиск по всей библиотеке.
- [x] **Lugat Smart Highlights:** Реализована автоматическая подсветка османских/арабских терминов в тексте с мгновенным переводом во всплывающем окне.
- [x] **GitHub Pages Stability:** Исправлены все проблемы с путями (404), сайт корректно работает по адресу `https://LiskinLabs.github.io/risale-library/`.
- [x] **Advanced PWA:** Агрессивное кэширование книг и шрифтов для полноценной работы оффлайн.
- [x] **Premium TTS Player:** Интегрирован аудио-плеер с поддержкой арабских голосов и визуализацией звука.

---

## 📍 Current Session State (2026-05-01)

1. **Status:** Проект находится в идеальном техническом состоянии. Код чист, типизирован и оптимизирован.
2. **Parallel Execution:** Работа ведется через 6 параллельных сессий Jules (UI, Search, PWA, Data, TTS, QA), что обеспечивает максимальную скорость внедрения фич.
3. **Zero 404:** Внедрена система `getAssetPath` для корректной работы статических ресурсов в облаке.
4. **Environment:** Ultra-Autonomous mode (Priority 999).

---

_End of Memory_
