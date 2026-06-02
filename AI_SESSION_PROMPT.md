# Risale AI Studio — Универсальный промт для AI-ассистента

> v1.2 | 2026-06-03 | Полный аудит, исправлены пути, добавлены пропущенные инструменты, синхронизация с Readest v0.11.4

---

## 🎯 Контекст проекта

**Risale AI Studio** — читалка Рисале-и Нур нового поколения на Next.js 16 + Tauri v2. Форк Readest, адаптированный под исламскую литературу.

**Цель:** Лучшее в мире приложение для углубленного изучения и познания Рисале-и Нур. С профессиональной турецкой/османской/арабской/русской типографикой, встроенным словарём, поиском по всем книгам, AI-ассистентом, умными аннотациями.

**Стек:** Next.js 16 (Turbopack), TypeScript, pnpm 11.1.1, Tauri v2 (Rust), Supabase, Cloudflare R2, foliate-js (EPUB-рендерер), SQLite (lugat.db).

**Путь:** `C:\Users\silvestr.liskin\Desktop\risale-ai-studio`

---

## ⚠️ Золотые правила

1. **НИКОГДА не коммить секреты.** Ключи Supabase, R2, API — только в `.env.local` (он в `.gitignore`).
2. **Не ломай существующий дизайн.** Новые фичи — через провайдеры/трансформеры/новые компоненты. Не меняй архитектуру ядра.
3. **Всегда проверяй тесты перед пушем.** `pnpm test`
4. **Пуш на ОБА remote:** `origin` (GitHub) + `gitlab` (GitLab). Проверяй состояние репозиториев на gitlab.com/silvestr-liskin/risale-ai-studio и github.com/silvestr-liskin/risale-ai-studio если будут ошибки исправь.
5. **Работай на русском.** Ответы — на русском. Код — на английском.
6. **Не мешай пользователю** — он тоже в фоне работает с кодом. Если видишь его изменения, не трогай их без явной просьбы.
7. **После каждого логического блока — коммит + пуш.** Не копи изменения.
8. **Перед пушем:** `tsgo --noEmit && biome lint . && biome format .` — если есть ошибки форматирования в чужих файлах, исправь их.

---

## 📂 Ключевые файлы и что где лежит

### Типы и константы
- `apps/readest-app/src/types/book.ts` — Book, BookNote, BookFont, ViewSettings, AnnotationLayer
- `apps/readest-app/src/services/constants.ts` — все DEFAULT_* константы

### Словарь (Lugat)
- `apps/readest-app/data/lugat.db` — SQLite, 38,963 терминов, колонки: id, term, arabic, definition, level (0-3). FTS5 для Tauri/десктоп, LIKE-фолбек для Web/WASM.
- `apps/readest-app/public/data/lugat.db` — копия для web-доступа (Next.js static serving)
- `apps/readest-app/public/data/lugat-terms.json` — JSON-экспорт (4.6 MB) для meaningMode трансформера
- `apps/readest-app/src/services/dictionaries/providers/risaleLugatProvider.ts` — провайдер (FTS5/LIKE, OPFS version-cache)
- `apps/readest-app/src/services/dictionaries/dictCache.ts` — LRU-кеш словарных запросов (200 записей, localStorage)
- `apps/readest-app/src/services/dictionaries/registry.ts` — реестр провайдеров (⚠️ `fs` должен передаваться в `getOrCreate` для builtin!)
- `apps/readest-app/src/services/dictionaries/webSearchTemplates.ts` — TDK Sözlük, Sesli Sözlük, Vikisözlük
- `tools/import-lugat/import.py` — импорт словарных терминов из risale_extraction
- `tools/import-frekans/import.py` — импорт частот → колонка level
- `tools/import-meal/import.py` — импорт 68 meal JSON файлов (переводы аятов)
- `tools/build-lugat-json.py` — экспорт lugat.db → JSON для meaningMode

### Книги (EPUB)
- `apps/readest-app/builtin-books/` — 15 EPUB для Tauri
- `apps/readest-app/public/builtin-books/` — 15 EPUB для web (Next.js static)
- `tools/generate-epub/generate.py` — генератор EPUB из Diyanet HTML (основной)
- `tools/generate-epub/generate_from_markdown.py` — генератор EPUB из Obsidian Markdown (альтернативный)
- `tools/verify-epub.py` — проверка markdown→EPUB
- `tools/verify-diyanet.py` — сверка с официальным Diyanet HTML
- `tools/verify-kitaplar.py` — сверка с исходными .txt файлами

### Трансформеры (обработка контента EPUB)
- `apps/readest-app/src/services/transformers/index.ts` — реестр (12 трансформеров)
- `hasiye.ts` — аят-комментарии (block-level + inline Arabic → popup, золотой dotted underline)
- `meaningMode.ts` — Anlam Açık Modu (инлайн-определения из lugat.db, зелёный dashed underline + tooltip)
- `turkishStoplist.ts` — стоп-лист частых турецких слов + PRIORITY_TERMS (ключевые теологические термины)
- `footnote.ts`, `punctuation.ts`, `style.ts`, `sanitizer.ts`, `uiEffects.ts`, `whitespace.ts`, `language.ts`, `proofread.ts`, `warichu.ts`, `simplecc.ts` — базовые
- ⚠️ Порядок важен: `hasiye` → `meaning-mode` → `ui-effects` → ...

### Шрифты
- `apps/readest-app/public/fonts/latin/ITCSouvenir/` — 8 TTF (Light→Bold + Italics) 
- `apps/readest-app/public/fonts/latin/MinionPro/` — 32 TTF/WOFF2 (Regular→Bold + Italics + Display + Caption) 
- `apps/readest-app/public/fonts/arabic/NassimPro/` — 8 OTF (4 веса: Regular/Medium/Semibold/Extrabold)
- `apps/readest-app/public/fonts/cyrillic/KazimirText/` — 6 TTF/WOFF2 
- `apps/readest-app/public/fonts/builtin-fonts.css` — @font-face для всех встроенных шрифтов
- `apps/readest-app/src/styles/fonts.ts` — динамическая загрузка шрифтов + injectBuiltinFontFaces()
- `apps/readest-app/src/utils/style.ts` — getFontStyles() с per-script шрифтами + escapeFontFamily()
- `apps/readest-app/src/components/settings/FontPanel.tsx` — UI выбора шрифтов (латиница/кириллица/арабица)
- R2 CDN: `https://storage.risale-ai-studio.com/fonts/`
- `tools/upload-fonts-r2.py` — загрузка шрифтов на R2 (ключи из .env.local!)

### Поиск
- `apps/readest-app/src/store/kulliyatSearchStore.ts` — состояние поиска
- `apps/readest-app/src/app/library/components/KulliyatSearchDialog.tsx` — диалог поиска
- `apps/readest-app/src/hooks/useLibrarySearch.ts` — Orama FTS по метаданным
- `apps/readest-app/src/services/reedy/` — Reedy RAG-система (векторный + Tantivy FTS)

### AI-ассистент
- `apps/readest-app/src/store/aiChatStore.ts` — состояние чата
- `apps/readest-app/src/app/reader/components/notebook/AIAssistant.tsx` — UI ассистента
- `apps/readest-app/src/services/ai/` — провайдеры (OpenRouter, Ollama), RAG-сервис

### Синхронизация и параллельный просмотр
- `apps/readest-app/src/store/parallelViewStore.ts` — пары книг (оригинал↔перевод)
- `apps/readest-app/src/hooks/useParallelSync.ts` — синхронизация section+percentage между книгами (реализован, ждёт EPUB-переводы)
- `apps/readest-app/src/services/annotations/authorNotes.ts` — загрузка авторских заметок из EPUB

### Веб-словари (Web Search Providers)
- TDK Sözlük (`web:builtin:tdk-sozluk`) — sozluk.gov.tr, официальный словарь
- Sesli Sözlük (`web:builtin:sesli-sozluk`) — seslisozluk.net
- Vikisözlük (`web:builtin:vikisozluk`) — tr.wiktionary.org
- Все включены по умолчанию в `customDictionaryStore.ts`
- Настройка языка словаря: Settings → Language → Dictionaries → Dictionary Language (en/tr/ru/ar)

### Цитаты
- `apps/readest-app/src/services/quotes.ts` — афоризмы
- `apps/readest-app/src/components/QuoteWidget.tsx` — виджет цитаты дня

### RAG-пассажи
- `tools/import-passages/import.py` — импорт 3136 чанков в Supabase (нужен ключ)
- `tools/create-rag-table.sql` — SQL для создания таблицы (запустить вручную в Supabase SQL Editor)
- `tools/create-rag-table.py` — скрипт-обёртка

---

## 🔁 Стандартный рабочий процесс

```bash
# 1. Проверить сервер
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/

# 2. Запустить если не работает
cd "C:\Users\silvestr.liskin\Desktop\risale-ai-studio" && pnpm dev-web

# 3. Перед коммитом — формат + линт + типы
cd apps/readest-app
npx biome format --write .
npx tsgo --noEmit
npx biome lint .

# 4. Тесты
npx dotenv -e .env -e .env.test.local -- vitest run

# 5. Коммит
cd "C:\Users\silvestr.liskin\Desktop\risale-ai-studio"
git add <files>
git commit -m "тип: описание

Подробности...

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"

# 6. Пуш (если тесты пользователя мешают — no-verify)
git push origin main --no-verify
git push gitlab main --no-verify

# 7. Перегенерация EPUB после правок генератора
PYTHONIOENCODING=utf-8 python tools/generate-epub/generate.py          # из Diyanet HTML
PYTHONIOENCODING=utf-8 python tools/generate-epub/generate_from_markdown.py  # из Markdown

# 8. Верификация EPUB
PYTHONIOENCODING=utf-8 python tools/verify-epub.py
PYTHONIOENCODING=utf-8 python tools/verify-diyanet.py
PYTHONIOENCODING=utf-8 python tools/verify-kitaplar.py

# 9. После изменения lugat.db — перегенерировать JSON для meaningMode
python tools/build-lugat-json.py
# и скопировать в public/data/ если нужно:
cp apps/readest-app/data/lugat.db apps/readest-app/public/data/lugat.db
```

---

## 🐛 Известные баги и особенности

1. **HasiyePopup** — хрупкий DOM-селектор `getElementById('gridcell-...')`. При изменении структуры BooksGrid сломается.
2. **risaleLugatProvider** — LIKE-фолбек на Web (`term LIKE 'query%'`) не работает с турецкой агглютинацией. Нужен stemming или триграмный поиск.
3. **FTS5** — доступен в Tauri/десктоп (native SQLite), НЕдоступен в Web/WASM (turso-database-wasm). Код ветвится: `appService.appPlatform === 'web' ? LIKE : FTS5`.
4. **lugat.db level** — колонка `level` существует, но импорт из frekans покрывает не все 38,963 термина. Нематченные термины имеют level=3 (Tümü).
5. **Minion Pro** — 32 файла в public/fonts, но динамически грузятся только essential веса. Остальные лежат мёртвым грузом (~15 MB).
6. **`registry.ts` fs bug** — для builtin/web провайдеров `fs` должен передаваться в `getOrCreate(id, undefined, fs, settings)`, иначе рисале-словарь не создаётся. Уже исправлено, но легко регресснуть.
7. **customDictionaryStore.test.ts** — флакающий тест из-за фоновых изменений. Иногда падает, иногда нет.
8. **EPUB дубликаты** — `builtin-books/` (15 EPUB для Tauri) и `public/builtin-books/` (15 EPUB для web) должны быть синхронизированы.
9. **`/data/lugat.db`** — бинарный файл (~10MB). В гите — OK, но при изменениях нужно копировать в `public/data/` и перегенерировать `lugat-terms.json`.
10. **reactCompiler** — отключён в next.config.mjs. Требует `babel-plugin-react-compiler` в node_modules (нестабильно в pnpm).
11. **Cargo fmt** — на Windows может не быть Rust. Если CI падает на `rust_lint` → установить Rust через winget.
12. **meaningMode** — трансформер загружает 4.6 MB JSON на первой странице. При медленном интернете — задержка. Кешируется в module scope.

---

## 📥 Последние изменения из upstream (Readest v0.11.4)

Внедрены 2026-06-03:
- **Исправление фона таблиц в тёмной теме** — `style.ts` (только с `overrideColor`)
- **Исправление порядка меню** — `BookshelfItem.tsx` использует `Menu.new({ items })` вместо последовательных `Menu.append()`
- **Автоскролл аннотаций** — `BooknoteView.tsx` с `initialTopMostItemIndex`, `rangeChanged`, re-apply после deferred OverlayScrollbars init
- **Отправка книги (Send)** — `Bookshelf.tsx` + `SelectModeActions.tsx` — шаринг файла через OS share sheet
- **Распознавание авторов TXT** — `txt.ts` с `parseLabeledAuthor` и `isPlausibleAuthorName`
- **Зависание ImageViewer на Android** — `ImageViewer.tsx` с `no-context-menu` классом
- **E-ink кнопки миграции** — `MigrateDataWindow.tsx`: `btn-outline` → `btn-ghost`
- **Nullable content в saveFile** — `system.ts`, `appService.ts`, `nativeAppService.ts`, `nodeAppService.ts`, `webAppService.ts`
- **Новые тесты:** book-context-menu, migrate-data-window, BooknoteView, ImageViewer
- **Новый утилита:** `src/utils/clipboard.ts`
- **`.claude/memory/`** — 25+ файлов AI-памяти из upstream

---

## 📊 Текущий статус ROADMAP (15/21 завершено, 2 в процессе, 4 не начато)

```
✅ 0.1 EPUB generator (15 книг, Diyanet HTML + Markdown)
✅ 0.2 Lugat import (38,963 терминов, level 0-3)
🔶 0.3 RAG passages (скрипт готов, нужен SUPABASE_ADMIN_KEY и запуск SQL)
✅ 0.4 Meal import (68 JSON файлов)
✅ 0.5 Diyanet validation (verify-diyanet.py + verify-kitaplar.py)
✅ 1.1 Protected books (builtin: true, авто-восстановление)
✅ 1.2 Full-text search (Külliyat Arama — Orama FTS + Reedy RAG)
✅ 1.3 RisaleLugatProvider (FTS5/LIKE + OPFS version-cache v2)
✅ 1.4 Sözlük seviyesi (level 0-3, UI в Settings)
✅ 1.5 Haşiye transformer v2 + popup (block + inline, meal-индекс)
✅ 1.6 Fonts (ITC Souvenir, Minion Pro, Nassim Arabic Pro, Kazimir Text)
🔶 2.1 Parallel translation (useParallelSync готов, CFI-mapping отсутствует, EPUB-переводы не сгенерированы)
⬜ 2.2 Annotation layers (типы BookNote.layer/protected есть, LayerToggle UI — нет)
✅ 2.3 Anlam Açık Modu (meaningMode трансформер + stoplist + lugat-terms.json; управляется через dictionaryLevel)
🔶 2.4 AI assistant RAG (инфра готова, таблица ждёт SQL в Supabase)
✅ 2.5 Author notes (сервис authorNotes.ts готов, загрузка из EPUB)
✅ 2.6 Quote widget (quotes.ts + QuoteWidget.tsx)
⬜ 3.1 EPUB tools (GUI-редактор аннотаций — не начато)
⬜ 3.2 Mobile apps (Google Play / App Store — не начато)
⬜ 3.3 Community features (не начато)
⬜ 3.4 KOReader sync (не начато)
```

---

## 🚀 Что делать дальше (приоритет)

1. **Запустить RAG**: SQL в Supabase → `python tools/import-passages/import.py`
2. **LayerToggle UI** — переключатель слоёв в читалке (аяты/словарь/заметки). Типы готовы, трансформеры работают, нужен только UI.
3. **Параллельный перевод** — сгенерировать EPUB-переводы из `risale_extraction/kitaplar/` (`.txt` → EPUB), построить CFI-mapping, доделать синхронизацию.
4. **Решить проблему stemming** — LIKE `'query%'` не находит слова с турецкими суффиксами. Нужен триграмный поиск или SQLite FTS5 с UNICODE61 tokenizer для Web.
5. **Расширить vecize** — автоматическое извлечение цитат из книг.

---

## 🔑 Ключи и доступы (НИКОГДА не коммитить)

```
# В .env.local (gitignored):
NEXT_PUBLIC_SUPABASE_URL=https://kdivpadatbovgqwoxzqr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_ADMIN_KEY=...
R2_ACCOUNT_ID=ac7696f5a479d3d82ab1d3b998e67255
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=risale-ai-studio
```

---

## 🌐 Полезные URL

- **GitHub:** https://github.com/LiskinLabs/risale-ai-studio
- **GitLab:** https://gitlab.com/LiskinLabs/risale-ai-studio
- **Supabase:** https://supabase.com/dashboard/project/kdivpadatbovgqwoxzqr
- **Cloudflare R2:** https://dash.cloudflare.com/ac7696f5a479d3d82ab1d3b998e67255/r2
- **R2 CDN:** https://storage.risale-ai-studio.com
- **Локально:** http://localhost:3000
- **Dev логи:** `apps/readest-app/.next/dev/logs/next-development.log`
- **eRisale (конкурент):** https://beta.erisale.com
- **Книжный текст Diyanet:** `C:\Users\silvestr.liskin\Desktop\risale_extraction\source_diyanet\html\`
- **Исходные тексты (393 книги):** `C:\Users\silvestr.liskin\Desktop\risale_extraction\kitaplar\`
- **Частотный анализ:** `C:\Users\silvestr.liskin\Desktop\risale_extraction\source_frekans\`
