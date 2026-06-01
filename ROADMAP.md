# Risale AI Studio — Master Roadmap

> v1.0 | 2026-06-01
> Объединяет: RISALE_FEATURES_DESIGN.md + ERISALE_COMPETITIVE_ANALYSIS.md + INTEGRATION_ANALYSIS.md

---

## Состояние проекта (baseline)

| Метрика | Значение |
|---|---|
| Тесты | 5048 passed, 8 skipped |
| Формат/lint | Biome + tsgo — чисто |
| Фреймворк | Next.js 16 + Tauri v2 |
| Рендерер | foliate-js (EPUB/PDF/MOBI/FB2/CBZ/TXT) |
| БД | Supabase (Pg) + Turso (SQLite) + локальный FS |
| Облако | Cloudflare R2 (книги) + Supabase (auth/данные) |
| Деплой | GitHub + GitLab (main branch) |

---

## Фаза 0: Данные (Data Pipeline)

> Срок: 2-3 недели
> Цель: Подготовить все данные из risale_extraction для использования в приложении

### 0.1 Генератор EPUB из `.txt`

- [ ] Python скрипт `tools/generate-risale-epub/generate.py`
- [ ] Парсинг формата kitaplar (маркеры `#N`, `&Title>`, `~Arabic|ref@`, `^footnote`)
- [ ] Генерация EPUB 3 с: метаданными, TOC, встроенными шрифтами, аннотациями
- [ ] Вход: `risale_extraction/kitaplar/{book}/`
- [ ] Выход: `apps/readest-app/src-tauri/resources/books/{book}.epub`

### 0.2 Импорт словаря в SQLite

- [ ] Python скрипт `tools/import-lugat/import.py`
- [ ] Чтение `risale_extraction/lugat/tr/` (56 файлов, 50K+ записей)
- [ ] Создание SQLite FTS5 таблицы
- [ ] Выход: `apps/readest-app/data/lugat.db`

### 0.3 Импорт RAG-чанков

- [ ] Python скрипт `tools/import-passages/import.py`
- [ ] Чтение `risale_extraction/source_markdown/ai/passages/all-passages.jsonl`
- [ ] Загрузка в Supabase (pgvector) или Qdrant
- [ ] 3136 чанков с embedding_text + метаданными

### 0.4 Импорт meal (Коран-переводы)

- [ ] Python скрипт `tools/import-meal/import.py`
- [ ] Чтение `risale_extraction/meal/tr/*.json` (68 файлов)
- [ ] Индексация по сура:аят → перевод
- [ ] Выход: SQLite таблица или JSON-файл

### 0.5 Валидация по Diyanet

- [ ] Сравнение сгенерированных EPUB с `source_diyanet/html/`
- [ ] Проверка alignment (99.7% target из source_markdown)
- [ ] Отчёт о расхождениях

---

## Фаза 1: Ядро рисале-функций (Core)

> Срок: 3-4 недели
> Цель: Базовые рисале-функции, без которых нельзя

### 1.1 Protected/Built-in книги

**Файлы:** `types/book.ts`, `services/bookService.ts`, `store/libraryStore.ts`

- [ ] Добавить `builtin?: boolean`, `builtinVersion?: number`, `builtinGroup?: string` в Book
- [ ] `deleteBook()`: блокировать удаление built-in книг
- [ ] UI: скрыть кнопку удаления для built-in книг
- [ ] Авто-восстановление: если файл повреждён → копия из `src-tauri/resources/`
- [ ] В LibraryStore: built-in книги всегда вверху

### 1.2 Полнотекстовый поиск (Külliyat Araması)

**Файлы:** `services/search/risaleSearch.ts` (новый), `store/searchStore.ts` (новый)

- [ ] SQLite FTS5 индекс по всем книгам
- [ ] Поиск по всем 15+ книгам одновременно
- [ ] Фильтрация по книгам
- [ ] Highlight совпадений
- [ ] Search UI: search bar + results panel
- [ ] Архитектура: локальный FTS5 (Turso) + опционально серверный (pgvector)

### 1.3 RisaleLugatProvider (встроенный словарь)

**Файлы:** `services/dictionaries/providers/risaleLugat.ts` (новый)

- [ ] Новый DictionaryProvider для люгата
- [ ] Чтение из SQLite `lugat.db`
- [ ] Определение языка интерфейса → язык словаря
- [ ] Интеграция с DictionaryService (lookup API)
- [ ] UI: popup при тапе на слово

### 1.4 Sözlük Seviyesi (уровни словаря)

**Файлы:** `services/dictionaries/levelFilter.ts` (новый)

- [ ] Импорт `source_frekans/` данных
- [ ] Уровни: Başlangıç (A1-A2), Orta (B1-B2), İleri (C1-C2), Tümü
- [ ] Фильтр: показывать определение только для слов ≥ выбранного уровня
- [ ] Настройка в SettingsPanel

### 1.5 Haşiye — аят-комментарии

**Файлы:** `services/transformers/hasiye.ts` (новый), `components/reader/HasiyePopup.tsx` (новый)

- [ ] Transformer: оборачивает аяты в `<span class="ayat" data-hasiye-id="...">`
- [ ] Подсветка аятов (золотой/зелёный highlight)
- [ ] Popup при тапе: текст аята + перевод + тафсир
- [ ] Интеграция с `meal/` для автоперевода аятов

### 1.6 Османские/арабские шрифты (Hatt-ı Kur'ân)

**Файлы:** `store/customFontStore.ts`, `components/settings/FontPanel.tsx`

- [ ] Встроенные османские шрифты в `fonts/`
- [ ] Переключение латиница ↔ османский в FontPanel
- [ ] "Hatt-ı Kur'ân" опция в настройках
- [ ] RTL-оптимизация для арабского текста

---

## Фаза 2: Продвинутый опыт (Advanced)

> Срок: 3-4 недели
> Цель: То, что отличает нас от eRisale и всех остальных

### 2.1 Параллельный перевод (Dual Book View)

**Файлы:** `hooks/useParallelSync.ts` (новый), `services/parallelSync.ts` (новый)

- [ ] CFI mapping: оригинал ↔ перевод
- [ ] Синхронизация скролла/страницы между двумя книгами
- [ ] UI: выбор языка перевода
- [ ] Автооткрытие пары при открытии оригинала

### 2.2 Многослойные аннотации

**Файлы:** `types/book.ts`, `components/reader/LayerToggle.tsx` (новый)

- [ ] Расширить `AnnotationLayer = 'user' | 'author' | 'hasiye' | 'lugat'`
- [ ] `protected?: boolean` в BookNote
- [ ] Layer toggle UI: вкл/выкл слоёв
- [ ] Цветовое кодирование: золотой (аят), зелёный (люгат), фиолетовый (автор)

### 2.3 Anlam Açık Modu (Open Meaning Mode)

**Файлы:** `services/transformers/meaningMode.ts` (новый), `components/reader/MeaningToggle.tsx` (новый)

- [ ] Заимствовать концепцию из `source_whatsapp_bot`
- [ ] `meaningDisplayMode: 'open' | 'closed'` в ViewSettings
- [ ] 'open': определения слов inline в тексте
- [ ] 'closed': чистый текст, неизвестные слова списком внизу
- [ ] Оптимизация: предфильтрованный словарь под страницу

### 2.4 AI-ассистент (RAG over Risale)

**Файлы:** `services/ai/risaleRAG.ts` (новый), `components/reader/AIAssistant.tsx` (дополнить)

- [ ] Claude API RAG на основе 3136 чанков из source_markdown
- [ ] Вопрос → релевантные пассажи → синтез ответа с цитатами
- [ ] Контекст: текущая книга + страница
- [ ] UX: боковая панель с чатом

### 2.5 Авторские примечания (Сильвестр)

**Файлы:** `services/annotations/authorNotes.ts` (новый)

- [ ] Загрузка author-notes из EPUB (annotations/author-notes.json)
- [ ] Отображение как protected BookNote (layer='author')
- [ ] Tooltip/сноска при наведении
- [ ] Возможность обновления через облако (без пересборки EPUB)

### 2.6 Цитата дня + Шаринг

**Файлы:** `components/QuoteWidget.tsx` (новый), `services/quotes.ts` (новый)

- [ ] Импорт `source_vecizeler/` данных
- [ ] Виджет на главном экране
- [ ] Шаринг: текст + книга + страница как изображение
- [ ] Push-уведомления с цитатой дня

---

## Фаза 3: Экосистема (Ecosystem)

> Срок: 4-6 недель
> Цель: Инструменты, сообщество, мобильные платформы

### 3.1 Инструменты генерации EPUB

- [ ] GUI для создания/редактирования аннотаций в EPUB
- [ ] Валидатор: проверка целостности EPUB + аннотаций
- [ ] CI/CD пайплайн: автосборка EPUB при обновлении исходников

### 3.2 Мобильные приложения

- [ ] Google Play: Tauri Android build
- [ ] App Store: Tauri iOS build
- [ ] PWA: улучшенный оффлайн-режим

### 3.3 Сообщество

- [ ] Пользовательские аннотации: шаринг слоёв
- [ ] Групповое чтение (из `source_okuma_program`)
- [ ] 120-дневная программа (из `source_takip`)
- [ ] Квизы и геймификация (из `source_trivianur`)

### 3.4 KOReader-интеграция

- [ ] Загрузка книг напрямую из облака в KOReader
- [ ] Синхронизация аннотаций через CRDT
- [ ] E-ink оптимизация для встроенных книг

---

## Приоритеты (Quick Wins)

**Неделя 1:**
1. `builtin` поле в Book + защита от удаления ← _1 час_
2. Импорт lugat в SQLite ← _2 часа_
3. EPUB generator для одной книги (Созлар) ← _3 часа_

**Неделя 2:**
4. RisaleLugatProvider ← _4 часа_
5. FTS5 поиск ← _6 часов_
6. Haşiye transformer ← _4 часа_

**Неделя 3:**
7. Османские шрифты ← _2 часа_
8. Anlam Açık Modu ← _6 часов_
9. Haşiye popup ← _4 часа_

**Неделя 4:**
10. Параллельный перевод (dual book) ← _8 часов_
11. Многослойные аннотации (LayerToggle) ← _4 часа_

---

## Статус-трекер

| ID | Задача | Фаза | Статус |
|---|---|---|---|
| 0.1 | EPUB generator | 0 | ⬜ |
| 0.2 | Lugat import | 0 | ⬜ |
| 0.3 | RAG passages import | 0 | ⬜ |
| 0.4 | Meal import | 0 | ⬜ |
| 0.5 | Diyanet validation | 0 | ⬜ |
| 1.1 | Protected books | 1 | ⬜ |
| 1.2 | Full-text search | 1 | ⬜ |
| 1.3 | RisaleLugatProvider | 1 | ⬜ |
| 1.4 | Sözlük seviyesi | 1 | ⬜ |
| 1.5 | Haşiye transformer | 1 | ⬜ |
| 1.6 | Osmanlı fonts | 1 | ⬜ |
| 2.1 | Parallel translation | 2 | ⬜ |
| 2.2 | Annotation layers | 2 | ⬜ |
| 2.3 | Anlam Açık Modu | 2 | ⬜ |
| 2.4 | AI assistant (RAG) | 2 | ⬜ |
| 2.5 | Author notes | 2 | ⬜ |
| 2.6 | Quote widget | 2 | ⬜ |
| 3.1 | EPUB tools | 3 | ⬜ |
| 3.2 | Mobile apps | 3 | ⬜ |
| 3.3 | Community features | 3 | ⬜ |
| 3.4 | KOReader sync | 3 | ⬜ |
