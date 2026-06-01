# Risale AI Studio — Integration Analysis: risale_extraction Assets

> 2026-06-01 | Анализ активов из `C:\Users\silvestr.liskin\Desktop\risale_extraction`

## Что такое risale_extraction

Это сырьевая база данных и коллекция референсных open-source проектов по Риcале-и Нур. Согласно `SOURCES.md`, содержит 18+ source-директорий + собственные данные (`kitaplar/`, `lugat/`, `meal/`) и инструменты (`segmenter_html.py`, `ultra_aligner.py`).

Пайплайн: Extraction → Alignment → Enrichment → Export в `risale-library/data/`.

---

## Активы для интеграции (по приоритету)

### 🔴 P0: Немедленная интеграция (MVP)

#### 1. `kitaplar/` — Книги в 25+ языках
- **393 книжных директорий**
- Формат: `.txt` с маркерами (`#page`, `&Section>`, `~Arabic|ref@`, `^footnote`)
- Языки: tr, ar, en, ru, de, es, fr, bn, zh, oz, uz, hu, nl, pl, pt, fi, ms, so, sw, ur, ko, el, tm, po
- **Как интегрировать:** Конвертировать `.txt` → EPUB через Python-скрипт. Маркеры уже есть — легко парсить:
  - `#N` → page break → `<div class="page" data-page="N">`
  - `&Title>` → `<h1>Title</h1>`
  - `~Arabic|ref@` → `<span class="ayat" data-ref="ref">Arabic</span>`
  - `^footnote` → `<aside epub:type="footnote">`

#### 2. `lugat/` — Словарь (6 языков, ~50K+ записей)
- Турецкий: 56 файлов (a-z), ~50K записей
- Узбекский (лат/кир), туркменский, голландский, испанский
- Формат: `word=meaning1, meaning2, ...`
- **Как интегрировать:** Импортировать в SQLite FTS5 таблицу → `RisaleLugatProvider` в DictionaryService
- И Turkish, и Ottoman terms уже есть — идеально для inline-определений

#### 3. `source_markdown/ai/passages/` — RAG-готовые чанки
- **3136 чанков** по 15 книгам в JSONL
- Каждый чанк: `chunk_id`, `text`, `embedding_text`, `keywords`, `tags`, `citation`, `official_alignment_status`
- Выравнены с официальным Diyanet текстом (99.7% similarity)
- **Как интегрировать:** Импортировать в векторную БД (Qdrant/pgvector) для AI-поиска и RAG

#### 4. `source_diyanet/` — Золотой стандарт турецкого текста
- 15 книг, HTML с чистым Diyanet-текстом
- Уже используется `segmenter_html.py` для экстракции
- **Как интегрировать:** Это эталонный текст для валидации EPUB-версий

---

### 🟡 P1: Интеграция во второй фазе

#### 5. `source_whatsapp_bot/` — Anlam Açık Modu
- **Ключевая фича**: `text_open` (с inline-определениями) / `text_closed` (чистый текст)
- Переключение одним флагом
- Словарь предварительно отфильтрован под страницу
- **Как интегрировать:**
  - Добавить `meaningDisplayMode: 'open' | 'closed'` в ViewSettings
  - Применить transformer `meaningMode.ts` — вставляет/убирает `<span class="word-meaning">`
  - Импортировать словарь в SQLite для быстрого lookup'а

#### 6. `source_frekans/` — Частотный анализ
- 15 книг проанализированы
- Top-100 слов покрывают 27.4% текста (индивидуально) / 22.6% (сложные формы)
- **Как интегрировать:**
  - Частота слова → его "сложность" → порог для показа определения
  - Редкие теологические термины авто-подсвечиваются
  - Spaced-repetition словарь для изучения османских терминов

#### 7. `source_hizmetsearch/` — Гибридный поиск
- 3-stage pipeline: Gemini query expansion → Qdrant vector + BM25 sparse → Cross-encoder rerank
- ~50K чанков, parallel highlighting via Cerebras
- AI-ответ с Gemini 2.5 Flash
- **Как интегрировать:** Архитектурный референс для нашего поискового движка
  - Query expansion → наш Claude API
  - Vector search → локальный или Supabase pgvector
  - Reranker → cross-encoder или LLM-based

#### 8. `meal/` — Коран-переводы (турецкий)
- 68 JSON файлов, сура-индексированные
- Каждая запись: `{id, meal}` — аят + перевод
- **Как интегрировать:** При тапе на аят в тексте — показать перевод из meal.json

---

### 🟢 P2: Интеграция в третьей фазе

#### 9. `source_vecizeler/` — Афоризмы
- Готовый набор коротких цитат
- **Как интегрировать:** Виджет "Цитата дня", шаринг в соцсети, push-уведомления

#### 10. `source_dijital/` — Эталонная архитектура
- Vue.js + Express + MongoDB full-stack app
- Референтные Mongoose-модели: Book, Page, Dictionary, Bookmark, Note, User
- `simple-search.js` для fallback-поиска
- **Как интегрировать:** Архитектурный референс, не код

#### 11. `source_trivianur/` — Геймификация
- Квизы и проверочные вопросы
- **Как интегрировать:** Интерактивное обучение — читатель отвечает на вопросы по прочитанному

#### 12. `source_takip/` + `source_okuma_program/` — Системы чтения
- 120-дневная программа, групповое чтение, синхронизация прогресса
- **Как интегрировать:** Reading plans, streaks, groups

---

## Что НЕ будем интегрировать (риски)

| Актив | Почему нет |
|---|---|
| `source_dijital/` UI (Vue.js) | У нас React/Next.js — UI несовместим |
| `source_obsidian_*` | Специфично для Obsidian, не для нашего use-case |
| WhatsApp Bot (`source_whatsapp_bot/` инфраструктура) | WhatsApp API — другой канал, не нужен |
| Android-приложения (`.apk`) | У нас Tauri, не нативно-Android |

---

## Стратегия интеграции (без поломки проекта)

### Принципы:

1. **Data-first, code-second**: Сначала импортируем ДАННЫЕ (книги, словари, чанки), потом пишем код для их использования
2. **New providers, not modifications**: Расширяем через провайдеры/трансформеры — не меняем существующую архитектуру
3. **Feature flags**: Все новые фичи за feature flag'ами — можно отключить
4. **Separate data pipeline**: Генерация EPUB из `.txt` — отдельный Python скрипт, не часть основного приложения

### Конкретный план:

#### Шаг 1: Данные
```bash
# Словарь в SQLite
python tools/import-lugat.py --source risale_extraction/lugat/tr/ --db apps/readest-app/data/lugat.db

# Генерация EPUB
python tools/generate-epub.py --source risale_extraction/kitaplar/sozlerY/ --output apps/readest-app/src-tauri/resources/books/

# Импорт RAG-чанков
python tools/import-passages.py --source risale_extraction/source_markdown/ai/passages/ --db supabase
```

#### Шаг 2: Провайдеры (новые файлы)
```
apps/readest-app/src/services/dictionaries/providers/risaleLugatProvider.ts  # Новый
apps/readest-app/src/services/transformers/hasiye.ts                          # Новый
apps/readest-app/src/services/transformers/meaningMode.ts                     # Новый
apps/readest-app/src/services/search/risaleSearch.ts                          # Новый
```

#### Шаг 3: UI-компоненты (новые файлы)
```
apps/readest-app/src/app/reader/components/HasiyePopup.tsx     # Новый
apps/readest-app/src/app/reader/components/LugatPopup.tsx      # Новый
apps/readest-app/src/app/reader/components/MeaningToggle.tsx   # Новый
apps/readest-app/src/components/QuoteWidget.tsx                # Новый
```

#### Шаг 4: Конфигурация (дополнения существующих)
```
# Добавить поля в:
apps/readest-app/src/types/book.ts    # meaningDisplayMode, annotation layers
apps/readest-app/src/store/readerStore.ts  # новые настройки
```

---

## Вывод

`risale_extraction` содержит **все необходимые данные** для запуска рисале-функций:

- ✅ **Книги**: 393 книги в 25+ языках (конвертировать в EPUB)
- ✅ **Словарь**: 50K+ османско-турецких терминов (импортировать в SQLite FTS5)
- ✅ **RAG-чанки**: 3136 предразмеченных пассажей (импортировать в векторную БД)
- ✅ **Эталонный текст**: Diyanet HTML (для валидации)
- ✅ **Anlam Açık Modu**: готовая концепция и формат данных
- ✅ **Частотный анализ**: 15 книг (для умного хайлайтинга)

**Ничего не ломаем**: все новые фичи добавляются через провайдеры, трансформеры и новые компоненты. Существующая архитектура (foliate-js, BooksGrid, annotation system) остаётся нетронутой.
