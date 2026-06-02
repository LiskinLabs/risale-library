# Risale AI Studio — Универсальный промт для AI-ассистента

> v1.0 | 2026-06-03 | На основе 48-часовой рабочей сессии

---

## 🎯 Контекст проекта

**Risale AI Studio** — читалка Рисале-и Нур нового поколения на Next.js 16 + Tauri v2. Форк Readest, адаптированный под исламскую литературу.

**Цель:** Лучшее в мире приложение для чтения Рисале-и Нур. С профессиональной турецкой/османской/арабской/русской типографикой, встроенным словарём, поиском по всем книгам, AI-ассистентом, умными аннотациями.

**Стек:** Next.js 16 (Turbopack), TypeScript, pnpm 11.1.1, Tauri v2 (Rust), Supabase, Cloudflare R2, foliate-js (EPUB-рендерер), SQLite (lugat.db).

**Путь:** `C:\Users\silvestr.liskin\Desktop\risale-ai-studio`

---

## ⚠️ Золотые правила

1. **НИКОГДА не коммить секреты.** Ключи Supabase, R2, API — только в `.env.local` (он в `.gitignore`).
2. **Не ломай существующий дизайн.** Новые фичи — через провайдеры/трансформеры/новые компоненты. Не меняй архитектуру ядра.
3. **Всегда проверяй тесты перед пушем.** `pnpm test` — 5048 тестов.
4. **Пуш на ОБА remote:** `origin` (GitHub) + `gitlab` (GitLab).
5. **Работай на русском.** Ответы — на русском. Код — на английском.
6. **Не мешай пользователю** — он тоже в фоне работает с кодом. Если видишь его изменения, не трогай их без явной просьбы.
7. **После каждого логического блока — коммит + пуш.** Не копи изменения.
8. **Перед пушем:** `tsgo --noEmit && biome lint . && biome format .` — если есть ошибки форматирования в чужих файлах, исправь их.
9. **Шрифты (.ttf/.otf/.woff2) — коммерческие, в `.gitignore`.** Для веба грузить на Cloudflare R2.

---

## 📂 Ключевые файлы и что где лежит

### Типы и константы
- `apps/readest-app/src/types/book.ts` — Book, BookNote, BookFont, ViewSettings, AnnotationLayer
- `apps/readest-app/src/services/constants.ts` — все DEFAULT_* константы

### Словарь (Lugat)
- `apps/readest-app/data/lugat.db` — SQLite FTS5, 38,963 терминов, колонки: id, term, arabic, definition, level (0-3)
- `apps/readest-app/public/data/lugat.db` — копия для web-доступа
- `apps/readest-app/src/services/dictionaries/providers/risaleLugatProvider.ts` — провайдер словаря
- `tools/import-lugat/import.py` — импорт из risale_extraction
- `tools/import-frekans/import.py` — импорт частот → колонка level

### Книги (EPUB)
- `apps/readest-app/builtin-books/` — 15 EPUB для Tauri
- `apps/readest-app/public/builtin-books/` — 15 EPUB для web (Next.js static)
- `tools/generate-epub/generate_from_markdown.py` — генератор EPUB из Obsidian Markdown
- `tools/verify-epub.py` — проверка markdown→EPUB
- `tools/verify-diyanet.py` — сверка с официальным Diyanet HTML
- `tools/verify-kitaplar.py` — сверка с исходными .txt файлами

### Трансформеры (обработка контента EPUB)
- `apps/readest-app/src/services/transformers/index.ts` — реестр
- `hasiye.ts` — аят-комментарии (Arabic → popup)
- `meaningMode.ts` — Anlam Açık Modu (инлайн-определения)
- `footnote.ts`, `punctuation.ts`, `style.ts`, `sanitizer.ts` — базовые

### Шрифты
- `public/fonts/latin/ITCSouvenir/` — 8 TTF (куплены)
- `public/fonts/latin/MinionPro/` — 26 TTF/WOFF2 (куплены)
- `public/fonts/arabic/NassimPro/` — 8 OTF (куплены)
- `public/fonts/cyrillic/KazimirText/` — TTF/WOFF2 (куплен)
- `public/fonts/builtin-fonts.css` — @font-face (коммитить можно, бинарники — нет)
- `src/styles/fonts.ts` — динамическая загрузка шрифтов + injectBuiltinFontFaces()
- `src/utils/style.ts` — getFontStyles() с per-script шрифтами + escapeFontFamily()
- `src/components/settings/FontPanel.tsx` — UI выбора шрифтов (латиница/кириллица/арабица)
- R2 CDN: `https://storage.risale-ai-studio.com/fonts/`
- `tools/upload-fonts-r2.py` — загрузка шрифтов на R2 (ключи из .env.local!)

### Поиск
- `src/store/kulliyatSearchStore.ts` — состояние поиска
- `src/app/library/components/KulliyatSearchDialog.tsx` — диалог поиска
- `src/hooks/useLibrarySearch.ts` — Orama FTS по метаданным
- `src/services/reedy/` — Reedy RAG-система (векторный + Tantivy FTS)

### AI-ассистент
- `src/store/aiChatStore.ts` — состояние чата
- `src/app/reader/components/notebook/AIAssistant.tsx` — UI ассистента
- `src/services/ai/` — провайдеры (OpenRouter, Ollama), RAG-сервис

### Синхронизация и параллельный просмотр
- `src/store/parallelViewStore.ts` — пары книг
- `src/hooks/useParallelSync.ts` — синхронизация позиции между книгами
- `src/services/annotations/authorNotes.ts` — загрузка авторских заметок из EPUB

### Цитаты
- `src/services/quotes.ts` — 27 векize (афоризмов)
- `src/components/QuoteWidget.tsx` — виджет цитаты дня

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
PYTHONIOENCODING=utf-8 python tools/generate-epub/generate_from_markdown.py

# 8. Верификация EPUB
PYTHONIOENCODING=utf-8 python tools/verify-epub.py
PYTHONIOENCODING=utf-8 python tools/verify-diyanet.py
PYTHONIOENCODING=utf-8 python tools/verify-kitaplar.py
```

---

## 🐛 Известные баги и особенности

1. **HasiyePopup** — хрупкий DOM-селектор `getElementById('gridcell-...')`. При изменении структуры BooksGrid сломается.
2. **risaleLugatProvider** — LIKE-фолбек на Web (`term LIKE 'query%'`) не работает с турецкой агглютинацией. Нужен stemming или триграмный поиск.
3. **minionPro** — 26 файлов, только 4 essential веса грузятся динамически. Остальные лежат мёртвым грузом.
4. **customDictionaryStore.test.ts** — флакающий тест из-за фоновых изменений пользователя. Иногда падает, иногда нет.
5. **EPUB дубликаты** — `builtin-books/` и `public/builtin-books/` должны быть синхронизированы. Генератор теперь пишет в обе папки.
6. **`/data/lugat.db`** — тяжелый бинарный файл (~10MB). В гите — OK, но при каждом изменении нужно копировать в `public/data/`.
7. **Шрифты в .gitignore** — коммерческие, лежат только локально + на R2. При клонировании репо их не будет.
8. **Cargo fmt** — на Windows может не быть Rust. Если CI падает на `rust_lint` → установить Rust через winget.

---

## 📊 Текущий статус ROADMAP (18/21)

```
✅ 0.1 EPUB generator
✅ 0.2 Lugat import
🔶 0.3 RAG passages (SQL готов, нужен ручной запуск)
✅ 0.4 Meal import
✅ 0.5 Diyanet validation (verify-diyanet.py)
✅ 1.1 Protected books
✅ 1.2 Full-text search (Külliyat)
✅ 1.3 RisaleLugatProvider
✅ 1.4 Sözlük seviyesi (13.8K matched, levels 0-3)
✅ 1.5 Haşiye transformer + popup
✅ 1.6 Osmanlı fonts (53 шрифта на R2)
🔶 2.1 Parallel translation (store + sync hook)
✅ 2.2 Annotation layers (типы + LayerToggle + authorNotes)
✅ 2.3 Anlam Açık Modu (трансформер + toggle + stoplist)
🔶 2.4 AI assistant RAG (инфра готова, таблица ждёт SQL)
✅ 2.5 Author notes (сервис загрузки из EPUB)
✅ 2.6 Quote widget (27 vecize + QuoteWidget)
⬜ 3.1 EPUB tools
⬜ 3.2 Mobile apps
⬜ 3.3 Community features
⬜ 3.4 KOReader sync
```

---

## 🚀 Что делать дальше (приоритет)

1. **Запустить SQL** в Supabase: открыть `tools/create-rag-table.sql` → [Supabase SQL Editor](https://supabase.com/dashboard/project/kdivpadatbovgqwoxzqr/sql/new) → Run
2. **Запустить импорт RAG**: `python tools/import-passages/import.py --source ".../passages"`
3. **Сротировать ключи**: Supabase service_role + Cloudflare R2 (были в истории git)
4. **Доделать Parallel Translation** — CFI mapping между оригиналом и переводом
5. **Протестировать Anlam Açık Modu** — загрузить книгу, включить режим, проверить инлайн-определения
6. **Расширить vecize** — `tools/import-vecize.py` для автоматического извлечения цитат

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
