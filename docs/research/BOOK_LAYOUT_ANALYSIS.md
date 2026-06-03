# Risale AI Studio — Анализ верстки книг и рекомендации

> v2.0 | 2026-06-02 | Claude Code Analysis + EPUB 3.4 Research + Project Audit
> Полный аудит системы отображения книг + EPUB 3.4 + предложения по улучшению + аудит проекта

---

## 1. Текущее состояние (Audit)

### 1.1 Архитектура рендеринга

```
User EPUB → foliate-js (view.js) → iframe per section
                                         ↓
                              Transform Pipeline (11 трансформеров)
                                         ↓
                              CSS Injection (getStyles) + Theme
                                         ↓
                              <foliate-view> web component (paginated/scrolled)
```

**Сильные стороны:**
- **foliate-js** — зрелый EPUB-рендерер с пагинацией, CFI, RTL, вертикальным текстом
- **Transform pipeline** — гибкая система пост-обработки контента (уже 11 трансформеров включая haşiye)
- **CSS-инжекция** — полный контроль над стилями через `getStyles()` (темы, шрифты, отступы)
- **ViewSettings** — 60+ пользовательских настроек (шрифты, темы, лейаут, параграфы)
- **BooksGrid** — до 4 книг одновременно (side-by-side, stacked)

**Слабые стороны (специфичные для рисале-текстов):**
1. EPUB CSS (`generate.py`) структурный, но примитивный — нет оптимизации для длинного религиозного текста
2. Haşiye-трансформер ищет только `<p class="arabic">` — не покрывает inline-аяты
3. Lugat-подсветка отсутствует на уровне рендеринга (только popup)
4. Нет визуальной иерархии для рисале-структуры (Sual/Elcevap, разделители, уровни важности)
5. Параллельный перевод есть в плане, но CFI-синхронизация не реализована
6. Османский шрифт (hattiKuran) — CSS готов, но шрифты не загружены

### 1.2 Текущий EPUB CSS (generate.py)

```css
/* Структурный, без цветов — правильно для темизации */
body { font-family: Georgia; line-height: 1.95; text-align: justify; }
.arabic { display: block; text-align: center; direction: rtl;
          font-size: 1.5rem; line-height: 2.5; margin: 1rem 0; }
.sual-elcevap { margin: 1rem 0; padding: 0.5rem 1rem; border-left: 3px solid; }
.separator { text-align: center; margin: 1.5rem 0; letter-spacing: 0.5rem; }
```

**Что хорошо:** структурный подход (без цветов), правильный direction для арабского.
**Чего не хватает:** иерархия текста, optimized для изучения, османские лигатуры.

### 1.3 ViewSettings — что уже доступно читателю

| Категория | Настройки | Статус |
|---|---|---|
| **Шрифты** | serif/sans/mono, размер (8-30px), жирность | ✅ |
| **Абзац** | line-height, word-spacing, letter-spacing, text-indent, justify, hyphenation | ✅ |
| **Поля** | top/bottom/left/right (0-88px), gap (0-10%) | ✅ |
| **Темы** | light/dark/sepia + custom (Palette-based) | ✅ |
| **Режимы** | paginated, scrolled, vertical-rl, animated | ✅ |
| **RTL** | auto-detect + manual override | ✅ |
| **E-ink** | оптимизация контраста, отключение теней/анимаций | ✅ |
| **Дистракшн-фри** | hide header/footer, double border, reading ruler | ✅ |
| **Шрифты** | кастомные (загрузка .otf/.ttf), хатти-куран опция | 🟡 шрифтов пока нет |
| **Словарь** | StarDict/MDict/Slob/DICT провайдеры + RisaleLugat | 🟡 UI требует доработки |

---

## 2. Рекомендации по верстке EPUB (generate.py)

### 2.1 Иерархическая структура текста

**Проблема:** текущий CSS делает все `<p>` одинаковыми. Рисале-текст имеет сложную структуру:
- Заголовки Слов/Писем/Лучей (h1-h4)
- Арабский текст аятов (блоки + inline)
- Диалоги Sual/Elcevap (вопрос-ответ)
- Авторские отступления (İhtar, Elhasıl)
- Разделители (***)
- Сноски автора

**Решение — CSS-классы с семантикой:**

```css
/* ── Рисале-специфичные блоки ── */

/* Вступительное слово (предисловие автора) */
.risale-preface {
  font-style: italic;
  margin: 2rem 1.5rem;
  padding: 0.8rem 1.2rem;
  border-left: 3px solid;
  opacity: 0.9;
}

/* Sual (Вопрос) */
.risale-sual {
  font-weight: 600;
  margin-top: 1.5rem;
  text-indent: 0;
}
.risale-sual::before {
  content: "Sual: ";
  font-weight: 700;
}

/* Elcevap (Ответ) */
.risale-elcevap {
  margin-bottom: 1.5rem;
  text-indent: 1.5rem;
}

/* İhtar (Предупреждение/важное замечание) */
.risale-ihtar {
  margin: 1.2rem 1rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.95rem;
}

/* Хашие (комментарий к аяту) — блочный вариант */
.risale-hasiye-block {
  margin: 0.5rem 2rem 1rem;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  opacity: 0.85;
}
.risale-hasiye-block::before {
  content: "Haşiye: ";
  font-weight: 600;
  display: block;
  margin-bottom: 0.3rem;
}

/* Группа аятов (когда несколько подряд) */
.ayat-group {
  display: block;
  margin: 1.5rem 0;
  padding: 1rem;
  text-align: center;
}

/* Нумерация страниц (для привязки к оригиналу) */
.page-marker {
  display: inline;
  font-size: 0.75rem;
  vertical-align: super;
  opacity: 0.5;
  user-select: none;
}
```

### 2.2 Улучшенная арабская типографика

```css
/* ── Арабский текст — расширенная поддержка ── */

/* Блочный аят */
.arabic {
  display: block;
  text-align: center;
  direction: rtl;
  font-family: "Scheherazade New", "Traditional Arabic", "Amiri",
               "Noto Naskh Arabic", serif;
  font-size: 1.5rem;
  line-height: 2.5;
  margin: 1.2rem 0;
  padding: 0.8rem 1.5rem;
  /* Тонкий визуальный разделитель — без цвета, через прозрачность */
  border-top: 1px solid rgba(128,128,128,0.2);
  border-bottom: 1px solid rgba(128,128,128,0.2);
}

/* Аят с референсом (сура:аят) */
.arabic.with-ref {
  position: relative;
  padding-bottom: 1.8rem;
}
.arabic .ayat-ref {
  display: block;
  text-align: center;
  direction: ltr;
  font-size: 0.75rem;
  opacity: 0.65;
  margin-top: 0.5rem;
  font-family: "Georgia", serif;
}

/* Инлайн-арабский (внутри турецкого/русского текста) */
.arabic-inline {
  direction: rtl;
  unicode-bidi: embed;
  font-family: "Scheherazade New", "Traditional Arabic", serif;
  font-size: 1.2em;
  vertical-align: baseline;
}

/* Хадис (отличается от аята стилем) */
.hadith {
  display: block;
  text-align: center;
  direction: rtl;
  font-family: "Traditional Arabic", "Amiri", serif;
  font-size: 1.2rem;
  line-height: 2.2;
  margin: 1rem 0;
  font-style: italic;
}

/* Османский текст (латиница османскими буквами) */
.osmanli {
  font-family: "OsmanliFont", "Rika", serif;
  direction: rtl;
  text-align: justify;
}

/* Аят с харакатами (огласовками) — увеличенный line-height */
.arabic.tashkeel {
  line-height: 3;
  font-size: 1.6rem;
}

/* Баемала (﷽) */
.basmala {
  display: block;
  text-align: center;
  direction: rtl;
  font-size: 2rem;
  line-height: 2.5;
  margin: 1.5rem 0 2rem;
}
```

### 2.3 Отзывчивая вёрстка (поддержка мобильных)

```css
/* Малые экраны: читабельный размер без горизонтального скролла */
@media (max-width: 480px) {
  body { font-size: 16px; line-height: 1.8; }
  .arabic { font-size: 1.25rem; padding: 0.5rem 0.8rem; }
  .sual-elcevap { margin: 0.8rem 0; padding: 0.4rem 0.6rem; }
}
```

### 2.4 Приоритетные изменения в `generate.py`

| # | Изменение | Сложность | Эффект |
|---|---|---|---|
| 1 | Добавить классы `.risale-sual`, `.risale-elcevap`, `.risale-ihtar` в парсер | Низкая | Структурная разметка |
| 2 | Добавить `.ayat-ref` для референсов аятов | Низкая | Навигация по Корану |
| 3 | Улучшить CSS для арабского: `.arabic`, `.basmala`, `.hadith` | Низкая | Типографика |
| 4 | Добавить `.page-marker` для нумерации страниц оригинала | Средняя | Привязка к бумажной книге |
| 5 | Генерировать аннотационные JSON (.hasiye.json) внутри EPUB | Средняя | Haşiye-слой |
| 6 | Встроить шрифты (Scheherazade New, Amiri) в EPUB | Средняя | Оффлайн-типографика |

---

## 3. Рекомендации по Reader UI

### 3.1 Режимы отображения для рисале-текстов

#### А. Режим «Изучение» (Study Mode)
Комбинация существующих настроек, оптимизированная для глубокого чтения:

- **Шрифт:** Georgia / Noto Serif (с засечками)
- **Размер:** 18-20px
- **Line-height:** 2.0-2.2
- **Межсловный:** +1px
- **Justification:** вкл
- **Hyphenation:** вкл
- **Отступы:** широкие (60px+)
- **Тема:** Sepia (тёплый фон для долгого чтения)
- **Haşiye:** sidebar (не popup)

#### Б. Режим «Обзор» (Skim Mode)
Быстрый просмотр структуры:

- **Шрифт:** Inter / System (без засечек)
- **Размер:** 14-16px
- **TOC:** всегда видим (pinned sidebar)
- **Haşiye:** выкл
- **Словарь:** выкл

#### В. Режим «Сравнение» (Compare Mode)
Две книги side-by-side (уже есть BooksGrid, нужна синхронизация):

- Оригинал + Перевод
- Синхронизация через CFI-mapping (оригинал ↔ перевод)
- Независимый скролл каждой панели (опционально связанный)

**Реализация:** Добавить `ReadingMode` preset в ViewSettings:
```typescript
type ReadingPreset = 'study' | 'skim' | 'compare' | 'custom';
interface ViewSettings {
  readingPreset?: ReadingPreset;
  // ... preset применяет группу настроек атомарно
}
```

### 3.2 Haşiye UX — улучшения

**Текущее состояние:** `HasiyePopup.tsx` — работает через base64-encoded текст + meal index. Popup при клике на аят.

**Проблемы:**
1. Только popup-режим — нет sidebar/inline вариантов
2. Нет визуальной индикации, что у аята есть хашие (до клика)
3. Meal-переводы есть только для турецкого (68 файлов)
4. Lugat-фолбек работает только если именно арабская фраза не найдена в meal

**Предложения:**

1. **Подсветка аятов до клика:** золотистый/зеленый пунктирный underline
```css
.hasiye-arabic {
  text-decoration: underline;
  text-decoration-color: rgba(180, 150, 50, 0.4);
  text-decoration-style: dotted;
  text-underline-offset: 0.3em;
  cursor: pointer;
  transition: text-decoration-color 0.2s;
}
.hasiye-arabic:hover {
  text-decoration-color: rgba(180, 150, 50, 0.8);
}
```

2. **Три режима отображения хашие:**
- **Popup** (текущий) — для быстрого взгляда
- **Sidebar** — для последовательного изучения аятов
- **Inline** — хашие вставляется под аятом мелким шрифтом (для экспорта/печати)

3. **Индикатор наличия хашие:** иконка 📝 или арабская каллиграфическая метка рядом с аятом

### 3.3 Lugat UX — словарь как first-class citizen

**Текущее состояние:** RisaleLugatProvider импортирован, но UI интеграция минимальна.

**Предложения:**

1. **Inline-определения (Anlam Açık Modu):**
```
Оригинал: "Hem rahîm ismi, bütün kâinatı ihata eden..."
Режим Açık: "Hem rahîm (Милосердный) ismi, bütün kâinatı (вселенную) ihata (охватывающий) eden..."
```

2. **Уровни сложности (Sözlük Seviyesi):**
- **Başlangıç (A1-A2):** показывать определения для всех османских/арабских слов
- **Orta (B1-B2):** показывать только для теологических терминов
- **İleri (C1-C2):** показывать только для редких/специфичных терминов
- **Tümü:** ничего не показывать

3. **Визуализация уровней в тексте:**
```css
.lugat-level-1 { border-bottom: 2px dotted rgba(200,100,100,0.6); } /* сложные */
.lugat-level-2 { border-bottom: 1px dotted rgba(180,150,50,0.5); }  /* средние */
.lugat-level-3 { border-bottom: 1px dashed rgba(100,150,200,0.4); } /* простые */
```

### 3.4 Система цветового кодирования слоёв

| Слой | Цвет | Стиль | Пример |
|---|---|---|---|
| **Аят (haşiye)** | Золотой `#C9A94E` | Пунктирное подчёркивание | Арабский текст |
| **Термин (lugat)** | Зелёный `#4A9C5D` | Пунктирное подчёркивание | Османское слово |
| **Автор (author)** | Фиолетовый `#8B5CF6` | Фоновый highlight | Заметка Сильвестра |
| **Пользователь (user)** | Жёлтый/синий/красный | Highlight (на выбор) | Свои заметки |
| **Грамматика** | Серый `#9CA3AF` | Тонкое подчёркивание | Морфология |

---

## 4. Типографика: специфика рисале-текстов

### 4.1 Шрифтовой стек

#### Для турецкого (латиница) — основной текст:
```
"Georgia", "Noto Serif", "Crimson Text", "Linux Libertine", serif
```
- Хорошая поддержка турецких диакритик (ğ, ş, ı, İ)
- Разборчивость на длинных дистанциях
- Лигатуры (fi, fl, ffi)

#### Для арабского/османского:
```
"Scheherazade New", "Traditional Arabic", "Amiri",
"Noto Naskh Arabic", "Uthmanic", serif
```
- **Scheherazade New** — SIL Open Font, лучшая читаемость для длинных текстов
- **Traditional Arabic** — компактный, хорош для inline
- **Amiri** — Naskh стиль, красивый для аятов
- **Noto Naskh Arabic** — fallback от Google

#### Для русского перевода:
```
"Georgia", "PT Serif", "Noto Serif", "Bookman Old Style", serif
```
- Хорошая кириллица, классический книжный стиль

### 4.2 Оптимальные параметры для рисале-чтения

| Параметр | Значение | Обоснование |
|---|---|---|
| **Font size** | 18px (base) | Крупнее обычного — текст плотный, требует внимания |
| **Line height** | 2.0 | Увеличенный интерлиньяж для сложного текста |
| **Text align** | Justify | Книжный формат, важно для арабского |
| **Paragraph indent** | 1.5em | Чёткое разделение мыслей |
| **Paragraph margin** | 0.6em | Небольшой отступ между параграфами |
| **Word spacing** | +1px | Лёгкое расширение для читаемости |
| **Letter spacing** | 0 | Без изменений (турецкий не требует) |
| **Hyphenation** | Auto | Правильный перенос для justify |
| **Page margin** | 60px top, 44px sides | Простор для заметок на полях |
| **Column width** | 65-75 символов | Оптимальная длина строки для чтения |

### 4.3 Специфика османского текста (Hat-tı Kur'ân)

Османский язык использует арабскую графику для турецких слов. Это создаёт особые требования:
- **Лигатуры:** Османский использует больше лигатур чем современный арабский
- **Контекстные формы:** буквы меняют форму в зависимости от позиции — нужно использовать шрифт с полной поддержкой Opentype GSUB
- **Направление:** RTL, но цифры и латинские вставки — LTR (bidi)

**Рекомендуемые османские шрифты:**
- **Rika** — традиционный османский рукописный (Rika style)
- **Osmanlı Naskh** — печатный стиль

---

## 5. Многослойная система аннотаций (Text Layers)

### 5.1 Визуализация слоёв

Каждый слой — независимый визуальный канал, который можно вкл/выкл:

```
┌──────────────────────────────────────────────────────┐
│ [Layer Toggle]  ✓ Аяты  ✓ Словарь  ✓ Заметки  ✗ TTS │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ﷽                                                   │ ← .basmala
│                                                      │
│  وَإِن يَكَادُ ٱلَّذِينَ كَفَرُوا۟                   │ ← .arabic (золотой underline)
│  ┌─ Haşiye ──────────────────────────┐              │ ← haşiye popup/sidebar
│  │ Bu âyet, kâfirlerin nazar...      │              │
│  └────────────────────────────────────┘              │
│                                                      │
│  Ey rahîm ismin cilvesi!                             │ ← обычный текст
│      ↑                                              │
│      └─ lugat: "Милосердный" (имя Аллаха)           │ ← словарный popup
│                                                      │
│  [Sual: Neden...]                          ┌─ 📝 ─┐ │ ← авторская заметка
│  [Elcevap: Çünkü...]                       └──────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 5.2 Реализация LayerToggle UI

```tsx
// Компонент для переключения слоёв
<LayerToggle layers={[
  { id: 'hasiye', label: 'Аяты', color: '#C9A94E', default: true },
  { id: 'lugat', label: 'Словарь', color: '#4A9C5D', default: true },
  { id: 'author', label: 'Заметки', color: '#8B5CF6', default: false },
  { id: 'grammar', label: 'Грамматика', color: '#9CA3AF', default: false },
]} />
```

### 5.3 Приоритет внедрения слоёв

1. **Фаза 1 (MVP):** Haşiye popup (✅ уже есть) + Lugat popup (✅ частично)
2. **Фаза 2:** Inline-определения (Anlam Açık Modu) + LayerToggle UI
3. **Фаза 3:** Авторские заметки + грамматические аннотации

---

## 6. Параллельный перевод — верстка

### 6.1 Side-by-side режим (оригинал + перевод)

```
┌──────────────────────┬──────────────────────┐
│    Sözler (Orijinal) │ Sözler (Русский)     │
│                      │                      │
│  ﷽                   │  ﷽                   │
│                      │                      │
│  Birinci Söz         │  Первое Слово        │
│                      │                      │
│  Besmele her hayrın  │  Бесмеле — источник  │
│  başıdır...          │  всякого блага...    │
│                      │                      │
│  [стр. 3/450]        │  [стр. 3/450]        │
└──────────────────────┴──────────────────────┘
```

**Требования к верстке:**
- Обе панели имеют одинаковый шрифтовой размер
- Синхронизация позиции (CFI-mapping или общий TOC)
- Независимая тема для каждой панели (например: sepia для оригинала, white для перевода)
- Разделитель — тонкая вертикальная линия или gap

**Реализация через BooksGrid:**
- BooksGrid уже поддерживает 2 книги side-by-side
- Нужно добавить CFI-синхронизацию через `useParallelSync`
- При скролле/перелистывании одной панели — вторая следует за ней

### 6.2 Stacked режим (оригинал над переводом)

```
┌─────────────────────────────────┐
│ ﷽                               │
│ Ey rahîm ismin cilvesi...       │ ← оригинал (турецкий)
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
│ О проявление имени Милосердный  │ ← перевод (русский)
│                                 │
│ [стр. 3/450]                    │
└─────────────────────────────────┘
```

**Реализация:** Один EPUB с двумя языками в одном section — `display: flex; flex-direction: column`.

---

## 7. Поиск и навигация

### 7.1 Визуализация результатов поиска

**Full-text search (Külliyat Araması):**
- Результаты группируются по книгам
- Сниппеты с подсветкой совпадений
- Быстрый переход к месту в книге (CFI)

**Верстка сниппетов:**
```
┌─ Поиск: "rahîm" ──────────────────────┐
│                                        │
│ 📖 Sözler — стр. 12                    │
│ ...ve rahîm isminin cilvesiyle...      │
│         ↑                              │
│    [подсвечено жёлтым]                 │
│                                        │
│ 📖 Mektubat — стр. 45                  │
│ ...rahîm sıfatı bütün kâinatı...       │
│                                        │
└────────────────────────────────────────┘
```

### 7.2 TOC-навигация

Текущий TOC строится из `<h1>-<h4>`. Для рисале-книг этого достаточно, но можно улучшить:
- **Quick-jump:** выпадающий список всех «Слов» (для Sözler) или «Писем» (для Mektubat)
- **Прогресс-бар:** визуальный индикатор "прочитано 15/33 Слов"
- **Breadcrumb:** "Sözler → Birinci Söz → стр. 5"

---

## 8. Производительность рендеринга

### 8.1 Текущие узкие места

1. **foliate-js пагинация** — пересчёт страниц при изменении размера шрифта (дорого для EPUB с 1000+ секций)
2. **Transform pipeline** — 11 трансформеров на каждый section load (дорого при скролле)
3. **Custom fonts** — загрузка .otf для османского может быть медленной

### 8.2 Оптимизации

1. **Lazy transform:** применять haşiye/lugat-трансформеры только для видимых секций
2. **Font preload:** `<link rel="preload">` для арабских шрифтов
3. **CSS contain:** `contain: layout style paint` для section-контейнеров
4. **Debounced font resize:** throttling пересчёта страниц при слайдере размера шрифта

---

## 9. План внедрения (дорожная карта)

### 🔴 Неделя 1-2: Критические улучшения EPUB

| # | Задача | Файлы | Часы |
|---|---|---|---|
| 1 | Улучшить CSS в `generate.py`: иерархия, арабский, Sual/Elcevap | `tools/generate-epub/generate.py` | 3 |
| 2 | Добавить парсинг Sual/Elcevap/İhtar в EPUB-генератор | `generate.py` | 2 |
| 3 | Регенерировать Sözler.epub с новым CSS | `generate.py` (run) | 1 |
| 4 | Haşiye-трансформер: улучшить детекцию (inline аяты) | `services/transformers/hasiye.ts` | 3 |
| 5 | Haşiye UX: underline-подсветка + режимы (popup/sidebar/inline) | `HasiyePopup.tsx` + CSS | 4 |

### 🟡 Неделя 3-4: Типографика + словарь

| # | Задача | Файлы | Часы |
|---|---|---|---|
| 6 | Загрузить и встроить арабские шрифты | `fonts/` + `generate.py` | 2 |
| 7 | Anlam Açık Modu: inline-определения | новый `meaningMode.ts` transformer | 6 |
| 8 | Lugat UI: уровневая подсветка слов | CSS + `LugatPopup.tsx` | 4 |
| 9 | Reading Presets (Study/Skim/Compare) | `ViewSettings` + UI | 3 |

### 🟢 Неделя 5-6: Параллельный перевод + слои

| # | Задача | Файлы | Часы |
|---|---|---|---|
| 10 | CFI-синхронизация для параллельного просмотра | `useParallelSync.ts` | 8 |
| 11 | LayerToggle UI | `LayerToggle.tsx` | 4 |
| 12 | Авторские примечания: загрузка из EPUB | `authorNotes.ts` | 3 |

---

## 10. Выводы

**Сильные стороны текущей системы:**
- Мощный рендерер (foliate-js), поддержка всех форматов
- Гибкая CSS-инжекция и темизация
- Transform pipeline позволяет менять контент на лету
- Уже есть фундамент для Haşiye и Lugat

**Ключевые области для улучшения:**
1. **EPUB CSS** — структурная разметка рисале-текстов (Sual/Elcevap, уровни, аяты)
2. **Арабская типографика** — качественные шрифты, правильные стили для аятов/хадисов/дуа
3. **Anlam Açık Modu** — инлайн-определения османских терминов
4. **Многослойный UI** — переключение слоёв (аяты, словарь, заметки)
5. **Параллельный перевод** — синхронизированный dual-book просмотр
6. **Читательские пресеты** — Study/Skim/Compare режимы в один клик

**Общая оценка:** проект имеет отличный технический фундамент (Readest/foliate-js). Требуется «последняя миля» — рисале-специфичная адаптация верстки и UX. Большинство улучшений могут быть сделаны в CSS и трансформерах без изменения ядра рендерера.

---

## 11. EPUB 3.4 — исследование и рекомендации

### 11.1 Текущий статус EPUB 3.4

EPUB 3.4 — ревизия, начатая W3C **11 февраля 2025**, завершение запланировано до **5 февраля 2027**. Текущий статус: **W3C Group Note (29 мая 2026)** — опубликован, но ещё не Recommendation.

Мы сейчас генерируем **EPUB 3.0** (в `generate.py`: `version="3.0"`). До EPUB 3.4 ещё далеко до финального Recommendation, но ключевые новшества уже известны.

### 11.2 Что нового в EPUB 3.4 (релевантное нам)

| Фича | EPUB 3.0/3.2 | EPUB 3.4 | Значимость для нас |
|---|---|---|---|
| **EPUB Annotations 1.0** | Приватные, нет обмена | Стандартный JSON формат (Web Annotation Data Model) | 🔴 Огромная |
| **Roll layout** | Только pre-paginated | Непрерывный скролл фикс. лейаута | 🟢 Низкая (не webtoons) |
| **Упрощение лейаута** | Много атрибутов | Удалены неиспользуемые атрибуты | 🟡 Средняя |
| **Аудио/видео** | HTML5 native | Без изменений | 🟢 Низкая |

### 11.3 EPUB Annotations 1.0 — ключевая фича для нас

**Это решает нашу главную архитектурную проблему!**

Мы планировали кастомный формат (`hasiye.json`, `lugat.json`, `author-notes.json`) внутри EPUB. Но EPUB 3.4 определяет **стандартный** профиль Web Annotation Data Model для аннотаций.

**Web Annotation Data Model (WADM) структура:**
```json
{
  "@context": "http://www.w3.org/ns/anno.jsonld",
  "type": "Annotation",
  "body": {
    "type": "TextualBody",
    "value": "Bu âyet, kâfirlerin nazarının...",
    "format": "text/html",
    "language": "tr"
  },
  "target": {
    "source": "section_001.xhtml",
    "selector": {
      "type": "TextQuoteSelector",
      "exact": "وَإِن يَكَادُ ٱلَّذِينَ كَفَرُوا۟"
    }
  },
  "motivation": "commenting"
}
```

**Почему это важно для нас:**
1. **Стандарт W3C** — наши аннотации смогут читать другие EPUB-ридеры (KOReader, Thorium, и т.д.)
2. **Готовый селектор** — TextQuoteSelector решает проблему привязки к тексту без CFI
3. **Мотивация** — `motivation: "commenting"` (хашие), `motivation: "defining"` (люгат), `motivation: "annotation"` (заметки)
4. **Мультиязычность** — `language` field для каждого body

### 11.4 Рекомендация: гибридный подход

**Сейчас (фаза 1-2):** продолжать с нашим кастомным JSON (быстрее, проще для MVP).
**Фаза 3+:** поддержать EPUB Annotations 1.0 как экспорт/импорт формат, сохраняя наши кастомные слои как superset.

```typescript
// Конвертер: наш формат → W3C Web Annotation
function toW3CAnnotation(hasiye: HasiyeEntry): W3CAnnotation {
  return {
    "@context": "http://www.w3.org/ns/anno.jsonld",
    type: "Annotation",
    motivation: "commenting",
    body: { type: "TextualBody", value: hasiye.commentary, format: "text/html", language: hasiye.commentaryLocale },
    target: { source: hasiye.cfi.split("!")[0], selector: { type: "TextQuoteSelector", exact: hasiye.ayatText } }
  };
}
```

### 11.5 Вывод по EPUB 3.4

- **Не нужно переходить сейчас** — EPUB 3.0 полностью достаточен
- **EPUB Annotations 1.0** — стратегически важно, закладываем в архитектуру
- **Ждём финального Recommendation** (~2027) для полного перехода на EPUB 3.4

---

## 12. Аудит проекта: что добавить/убрать

### 12.1 Текущие версии (все актуальные)

| Зависимость | Текущая | Latest | Статус |
|---|---|---|---|
| Next.js | 16.2.6 | 16.2.6 | ✅ |
| React | 19.2.5 | 19.2.5 | ✅ |
| Tauri | 2.10.1 | 2.10.x | ✅ |
| pnpm | 11.1.1 | 11.x | ✅ |
| foliate-js | workspace:* | — | ✅ (форк) |

**Вывод: критические зависимости актуальны, обновлений не пропущено.**

### 12.2 Что можно добавить

#### 🔴 Высокий приоритет

| # | Что | Зачем | Усилия |
|---|---|---|---|
| 1 | **React Compiler** (уже в Next 16!) | Автоматическая мемоизация, меньше ререндеров в читалке | 1 строка в `next.config.ts` |
| 2 | **Turbopack File System Caching** | 5-10x быстрее dev-перезапуски | 1 строка конфига |
| 3 | **Next.js DevTools MCP** | AI-дебаггинг с контекстом роутов, кеша, ошибок | Подключить MCP |
| 4 | **EPUB Annotations 1.0 adapter** | Совместимость со стандартом W3C | Новый файл `w3cAnnotationAdapter.ts` |
| 5 | **Web Vitals мониторинг** | Метрики производительности читалки (LCP, INP) | `@vercel/analytics` |

#### 🟡 Средний приоритет

| # | Что | Зачем | Усилия |
|---|---|---|---|
| 6 | **Biome 2.0** (если вышел) | Быстрее линтинг, новые правила | Проверить |
| 7 | **Vitest Browser Mode** | Тестирование компонентов читалки в реальном DOM | Новый конфиг |
| 8 | **Storybook для Reader-компонентов** | Визуальная разработка компонентов читалки | Setup |
| 9 | **View Transitions API** (React 19.2!) | Плавные переходы библиотека↔читалка | CSS анимации |
| 10 | **pnpm v9+ каталожные зависимости** | Ускорение CI, детерминизм | Конфигурация |

#### 🟢 Низкий приоритет (на будущее)

| # | Что | Зачем |
|---|---|---|
| 11 | Cloudflare D1 (вместо Turso для serverless) | Бесплатный SQLite в облаке |
| 12 | Bun as runtime (альтернатива Node) | 3-5x быстрее установка зависимостей |
| 13 | WebAssembly OCR (Tesseract.js) | Распознавание текста со сканов османских книг |
| 14 | WebGPU acceleration for PDF | Быстрее рендеринг PDF (если foliate-js поддержит) |

### 12.3 Что можно убрать/оптимизировать

| # | Что | Почему | Эффект |
|---|---|---|---|
| 1 | **Дубликаты MCP в `.claude.json`** | `firecrawl`, `browser-use` дублируются из глобального `.mcp.json` | Чистота конфига |
| 2 | **`middleware.ts`** (если есть) | Next.js 16: заменить на `proxy.ts` | 1 файл переименовать |
| 3 | **`next lint` в CI** | Next 16 удалил `next lint` — использовать Biome напрямую | CI пайплайн |
| 4 | **AMP-related код** | Next 16 удалил AMP поддержку | Поиск и удаление |
| 5 | **`experimental.dynamicIO`** (если есть) | Переименован в `cacheComponents` в Next 16 | Конфиг |
| 6 | **Устаревшие `.mjs` импорты** | Переход на ESM-only где возможно | Чистота |
| 7 | **Неиспользуемые dictionary provider'ы** | StarDict/MDict/Slob/DICT — 4 провайдера, реально нужен 1 (RisaleLugat) | Бандл |

### 12.4 Новые Claude Code возможности (мог пропустить)

| # | Возможность | Статус |
|---|---|---|
| 1 | **Workflow (ulti-code)** — мульти-агентная оркестрация через `Workflow` tool | Доступен, не использовали |
| 2 | **Teams** — `TeamCreate`, параллельные агенты с общей task list | Доступен, не использовали |
| 3 | **MCP: Firecrawl** — веб-скрапинг + поиск | ✅ Используем |
| 4 | **MCP: Browser Use** — браузерная автоматизация (альтернатива Puppeteer) | Доступен, не использовали |
| 5 | **MCP: Vercel** — управление деплоем из Claude Code | Доступен (без токена пока) |
| 6 | **Skills: `/loop`** — автономные периодические задачи | Доступен |
| 7 | **Skills: `feature-dev`** — guided feature development | Доступен |

### 12.5 Обнаруженные ошибки (на лету)

| # | Ошибка | Файл | Статус |
|---|---|---|---|
| 1 | `middleware.ts` → нужно переименовать в `proxy.ts` (Next.js 16) | `apps/readest-app/src/` | 🔧 Исправить |
| 2 | `next lint` в CI/CD скриптах больше не работает (Next 16 удалил) | `.github/workflows/` | 🔧 Исправить |
| 3 | EPUB `version="3.0"` — можно обновить до `version="3.3"` (последний Recommendation) | `tools/generate-epub/generate.py` | 🔧 Исправить |
