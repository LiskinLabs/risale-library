# Risale-i Nur — Архитектура встроенных книг и умного текста

> Design Document v1.0 | 2026-06-01
> Проект: risale-ai-studio (форк Readest)

---

## 1. Формат книг: EPUB 3 + кастомные расширения

### Почему EPUB 3

| Критерий | EPUB 3 |
|---|---|
| Уже поддерживается | ✅ foliate-js (полный парсинг, пагинация, CFI) |
| Встроенные шрифты | ✅ `@font-face` для османского/арабского |
| Сноски | ✅ `<aside epub:type="footnote">` нативные |
| RTL/вертикальный текст | ✅ `writing-mode: horizontal-rl` |
| Медиа-оверлеи | ✅ аудио-синхронизация (будущий TTS) |
| Генерация | ✅ Python/JS скрипты генерируют EPUB программно |
| Стандарт | ✅ Открытый, не привязан к вендору |

### Структура EPUB для книг Рисале-и Нур

```
risale-books/
├── sozler.epub
│   ├── META-INF/container.xml
│   ├── OEBPS/
│   │   ├── content.opf          # манифест + spine + метаданные
│   │   ├── toc.ncx              # оглавление
│   │   ├── nav.xhtml            # EPUB 3 навигация
│   │   ├── css/
│   │   │   ├── style.css        # основные стили
│   │   │   └── osmanli.css      # османские/арабские шрифты
│   │   ├── fonts/
│   │   │   ├── OsmanliFont.otf
│   │   │   └── ArabicFont.ttf
│   │   ├── images/
│   │   │   └── cover.jpg
│   │   ├── text/
│   │   │   ├── soz_001.xhtml    # каждое "Слово" — отдельный section
│   │   │   ├── soz_002.xhtml
│   │   │   └── ...
│   │   └── annotations/         # 🆕 кастомное расширение
│   │       ├── hasiye.json      # хашие-комментарии к аятам
│   │       ├── lugat.json       # словарь терминов
│   │       └── author-notes.json # примечания автора (Сильвестр)
│   └── mimetype
```

### Почему аннотации ВНУТРИ EPUB

- **Портативность**: одна книга = один файл, всё внутри
- **Оффлайн**: не нужен сервер для просмотра комментариев
- **Версионирование**: аннотации версионируются вместе с книгой
- **KOReader-совместимость**: плагин читает EPUB напрямую

### Альтернатива: отдельные JSON-слои

Можно хранить аннотации отдельно от EPUB (в `Books/<hash>/layers/`), плюсы:
- Можно обновлять аннотации без пересборки EPUB
- Разные версии аннотаций для разных языков
- Пользователь может добавлять свои слои

**Рекомендация**: гибрид — аннотации внутри EPUB как "заводские", плюс возможность загружать дополнительные слои из облака.

---

## 2. Многослойная система текста (Text Layers)

### Концепция

Каждый рисале-текст имеет несколько параллельных «слоёв»:

```
┌─────────────────────────────────────────────┐
│ Слой 0: Оригинал (османский/арабский)       │  ← всегда видим
├─────────────────────────────────────────────┤
│ Слой 1: Перевод (русский/турецкий/etc)      │  ← параллельный показ
├─────────────────────────────────────────────┤
│ Слой 2: Хашие (комментарии к аятам)         │  ← всплывающие подсказки
├─────────────────────────────────────────────┤
│ Слой 3: Авторские примечания (Сильвестр)    │  ← выделения + заметки
├─────────────────────────────────────────────┤
│ Слой 4: Люгат (словарь терминов)            │  ← tap-to-define
└─────────────────────────────────────────────┘
```

### Техническая реализация слоёв

#### Слой 0 + Слой 1: Параллельный текст (Оригинал + Перевод)

**Вариант А — Два EPUB + синхронизированный показ:**

Используем уже существующий `BooksGrid` — он поддерживает parallel view (2 книги рядом).

- `sozler-original.epub` — оригинал
- `sozler-translation-ru.epub` — перевод
- Синхронизация через общий TOC/CFI mapping
- Плюс: никаких изменений в рендерере
- Минус: нужно синхронизировать скролл/страницу между двумя iframe

**Вариант Б — Один EPUB с параллельным текстом:**

Каждый `<section>` содержит оба текста в разных `<div>`:

```html
<div class="parallel-text">
  <div class="original" lang="ota">
    <p>Bismillâhirrahmânirrahîm...</p>
  </div>
  <div class="translation" lang="ru">
    <p>Во имя Аллаха, Милостивого, Милосердного...</p>
  </div>
</div>
```

- CSS: `display: grid; grid-template-columns: 1fr 1fr;` (side-by-side)
- Или: оригинал сверху, перевод снизу (stacked)
- Переключается в настройках
- Плюс: синхронизация автоматическая (один DOM)
- Минус: нужен кастомный CSS/transform при рендеринге

**Рекомендация: Вариант А (два EPUB + BooksGrid)**

- Не требует изменений в рендерере
- BooksGrid УЖЕ поддерживает 2 книги side-by-side
- Каждый перевод — отдельный EPUB (можно добавлять новые языки)
- Синхронизация через общий хеш книги + CFI mapping

#### Слой 2: Хашие (аят-комментарии)

**Формат данных:**

```json
{
  "hasiye": [
    {
      "id": "h_s_001_aya_01",
      "ayatText": "وَإِن يَكَادُ ٱلَّذِينَ كَفَرُوا۟",
      "ayatRef": "68:51",  // ссылка на Коран
      "commentary": "Этот аят указывает на силу взгляда...",
      "cfi": "epubcfi(/6/4[soz_001]!/4/2/12)",
      "source": "Bediüzzaman Said Nursi",
      "position": "inline" | "sidebar" | "popup"
    }
  ]
}
```

**Рендеринг:**

- Аят в тексте подсвечивается (special highlight style: золотой/зелёный)
- Tap по аяту → popup/sidebar с хашие
- Можно переключать режим: inline (под текстом), sidebar, popup
- **Трансформер** в пайплайне: `hasiye.ts` — ищет аяты в тексте и оборачивает их в `<span class="ayat" data-hasiye-id="...">`

#### Слой 3: Авторские примечания

Это самый простой слой — обычные аннотации Readest, но:

- **Глобальные** (global=true) — привязываются к тексту, а не к позиции
- **Цветовое кодирование**: отдельный цвет для авторских заметок (например, фиолетовый)
- **Предзагруженные**: идут в комплекте с книгой
- **Неудаляемые**: protected-флаг в `BookNote` (`protected?: boolean`)

```typescript
// Расширение BookNote (src/types/book.ts)
export interface BookNote {
  // ... существующие поля ...
  protected?: boolean;    // нельзя удалить пользователю
  layer?: 'user' | 'author' | 'hasiye' | 'lugat';
  locale?: string;        // язык аннотации (ru, tr, en, ...)
}
```

#### Слой 4: Люгат (словарь)

**Формат данных:**

```json
{
  "lugat": [
    {
      "id": "l_001",
      "term": "rahîm",
      "termArabic": "رَحِيم",
      "definition": "Милосердный (одно из 99 имён Аллаха)",
      "definitionRu": "...",
      "definitionTr": "...",
      "root": "r-h-m",
      "cfi": "epubcfi(...)"  // где встречается в тексте
    }
  ]
}
```

**Рендеринг:**
- Слова/термины подсвечены в тексте (пунктирное подчёркивание)
- Tap по слову → popup с определением
- Можно открыть полный люгат как sidebar
- Использует существующую DictionaryService инфраструктуру
- **Новый DictionaryProvider**: `risaleLugatProvider` — читает из JSON внутри EPUB

---

## 3. Встроенные книги (Protected/Built-in Books)

### Как интегрировать

**Вариант А: Бандл с приложением (Tauri resources)**

Книги кладутся в `src-tauri/resources/risale-books/` и копируются при первом запуске:

```
src-tauri/
├── resources/
│   └── risale-books/
│       ├── sozler.epub
│       ├── mektubat.epub
│       ├── lemalar.epub
│       ├── sualar.epub
│       └── manifest.json
```

**Вариант Б: Скачивание из Cloudflare R2 при первом запуске**

Книги лежат в R2 бакете, при первом запуске скачиваются. Хеши проверяются на обновления.

**Вариант В: Гибрид**

Базовые книги в бандле, расширенная коллекция + переводы — через облако.

### Механика protected-книг

```typescript
// Расширение Book (src/types/book.ts)
export interface Book {
  // ... существующие поля ...
  builtin?: boolean;          // встроенная книга
  builtinVersion?: number;    // версия для автообновления
  builtinGroup?: string;      // группа: 'risale', 'nur', etc.
}

// В bookService.ts:
export const deleteBook = async (book: Book, deleteAction: DeleteAction) => {
  if (book.builtin) {
    throw new Error('Cannot delete built-in books');
  }
  // ...
};
```

- В UI кнопка удаления скрыта/заблокирована для built-in книг
- В LibraryStore built-in книги всегда показываются первыми
- При повреждении/удалении файла — автоматическое восстановление из бандла

---

## 4. Технический план реализации

### Фаза 1: Инфраструктура (2-3 недели)

| Задача | Файлы | Описание |
|---|---|---|
| Protected books | `types/book.ts`, `bookService.ts`, `libraryStore.ts` | Добавить `builtin` поля в Book, защиту от удаления |
| EPUB annotation extractor | `services/annotations/risaleExtractor.ts` | Читать `annotations/*.json` из EPUB при import |
| Annotation layers | `types/book.ts` (BookNote.layer, BookNote.protected) | Расширить модель аннотаций |
| Parallel view sync | `hooks/useParallelSync.ts`, `BooksGrid.tsx` | Синхронизация CFI между двумя книгами |

### Фаза 2: Люгат + Хашие (2-3 недели)

| Задача | Файлы | Описание |
|---|---|---|
| RisaleLugatProvider | `services/dictionaries/providers/risaleLugat.ts` | Провайдер словаря из JSON |
| Hasiye transformer | `services/transformers/hasiye.ts` | Подсветка аятов в тексте |
| Hasiye popup | `components/reader/HasiyePopup.tsx` | Попап с комментарием к аяту |
| Lugat popup | `components/reader/LugatPopup.tsx` | Попап с определением термина |

### Фаза 3: Авторские примечания + UI (1-2 недели)

| Задача | Файлы | Описание |
|---|---|---|
| Author notes layer | `services/annotations/authorNotes.ts` | Загрузка/отображение авторских заметок |
| Layer toggle UI | `components/reader/LayerToggle.tsx` | Вкл/выкл слоёв (хашие, люгат, заметки) |
| Custom highlight colors | `types/book.ts`, `ColorPanel.tsx` | Новые цвета для слоёв (золотой, зелёный, фиолетовый) |

### Фаза 4: Инструменты генерации книг (2-3 недели)

| Задача | Файлы | Описание |
|---|---|---|
| EPUB generator | `tools/generate-risale-epub/` | Python/Node скрипт сборки EPUB с аннотациями |
| Text-to-JSON converter | `tools/text-to-layers/` | Конвертация текстов Рисале в JSON-слои |
| Validation tool | `tools/validate-risale-book/` | Проверка целостности EPUB + аннотаций |

---

## 5. Модель данных (ключевые расширения)

```typescript
// ─── Book extensions ───
interface Book {
  // ... существующие поля ...
  builtin?: boolean;
  builtinVersion?: number;
  builtinGroup?: 'risale' | 'nur' | 'custom';
  pairedBookHash?: string;   // хеш книги-перевода
}

// ─── Annotation layers ───
type AnnotationLayer = 'user' | 'author' | 'hasiye' | 'lugat';

interface BookNote {
  // ... существующие поля ...
  protected?: boolean;
  layer?: AnnotationLayer;
  locale?: string;
  data?: Record<string, unknown>;  // произвольные данные слоя
}

// ─── Hasiye (аят-комментарий) ───
interface HasiyeEntry {
  id: string;
  ayatText: string;       // текст аята на арабском
  ayatRef: string;        // ссылка: сура:аят
  commentary: string;     // комментарий (HTML)
  commentaryLocale: string;
  source?: string;        // источник комментария
  cfi: string;            // позиция в книге
}

// ─── Lugat (словарная статья) ───
interface LugatEntry {
  id: string;
  term: string;           // термин (османский/арабский)
  transliteration: string;
  definitions: Record<string, string>;  // locale → definition
  root?: string;          // корень слова
  relatedTerms?: string[];
  cfi?: string;           // где встречается
}

// ─── Parallel book mapping ───
interface ParallelBookMapping {
  originalHash: string;
  translationHash: string;
  translationLocale: string;
  cfiMap: Record<string, string>;  // original CFI → translation CFI
}
```

---

## 6. Почему НЕ разметка (Markdown/XML/кастомный формат)

| Подход | Проблемы |
|---|---|
| Markdown | Нет поддержки RTL, сносок, встроенных шрифтов |
| Кастомный XML | Нужно писать свой парсер + рендерер (3-6 месяцев) |
| HTML | Нет пагинации, TOC, метаданных |
| **EPUB 3** ✅ | Всё уже есть: парсер (foliate-js), рендерер, пагинация, CFI, шрифты |

EPUB 3 — это zip с HTML. Мы можем генерировать его программно, хранить аннотации внутри как custom resources, и при этом вся инфраструктура чтения уже готова.

---

## 7. Ближайшие шаги

1. **Создать один тестовый EPUB** — "Созлар" с 2-3 аятами, хашие, люгат-терминами
2. **Написать `risaleExtractor.ts`** — читает `annotations/*.json` из EPUB при import
3. **Добавить `builtin` защиту** — простые изменения в Book + bookService + UI
4. **Прототип параллельного просмотра** — 2 книги side-by-side в BooksGrid
5. **Прототип хашие-popup** — кастомный transformer + popup компонент
