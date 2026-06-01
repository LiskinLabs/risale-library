# eRisale.com — Competitive Analysis & Feature Mapping

> 2026-06-01 | risale-ai-studio vs beta.erisale.com

## 1. Технический стек eRisale

| Компонент | eRisale | risale-ai-studio |
|---|---|---|
| Фреймворк | Next.js (web only) | Next.js 16 + Tauri v2 (web + desktop + mobile) |
| Рендеринг | Кастомный HTML renderer | foliate-js (EPUB/PDF/MOBI) |
| Формат книг | Встроенный HTML/Markdown в коде | EPUB 3 (стандартный формат) |
| База данных | Вероятно PostgreSQL/Supabase | Supabase + Turso (SQLite) + локальный FS |
| Авторизация | Google OAuth + email magic link | Google OAuth + email (Supabase Auth) |
| PWA | Да (offline через service worker) | Да (Serwist/Workbox) + native app |
| Поиск | Server-side full-text search | Пока нет (нужно добавить) |
| Синхронизация | Cloud sync (заметки + закладки) | CRDT-based replica sync (WebSocket) |
| Словарь | Кастомный османско-турецкий | StarDict/MDict/Slob/DICT провайдеры |

## 2. Полный список функций eRisale → Наш статус

### ✅ Уже есть у нас

| # | Функция eRisale | Наш эквивалент | Статус |
|---|---|---|---|
| 1 | Gece Okuma (ночной режим) | Theme system: light/dark/sepia/contrast + custom | ✅ Готово |
| 2 | Renkli İşaretleme (4 цвета) | HighlightStyle + HighlightColor (6+ цветов) | ✅ Готово |
| 3 | Not Alın (заметки) | BookNote system (annotation + bookmark + excerpt) | ✅ Готово |
| 4 | Çoklu Sekme (множество вкладок) | BooksGrid (до 4 книг одновременно) | ✅ Готово |
| 5 | Yazı tipi, boyutu, satır aralığı | FontPanel, LayoutPanel (полная кастомизация) | ✅ Готово |
| 6 | Kenar boşlukları (отступы) | marginTopPx, marginBottomPx, marginLeftPx, marginRightPx | ✅ Готово |
| 7 | Sunum Modu (режим презентации) | Нет отдельного режима, но можно скрыть UI (distraction-free) | 🟡 Частично |
| 8 | Otomatik Kaydırma (автоскролл) | scrolled mode + continuous scroll | ✅ Готово |
| 9 | Çevrimdışı Okuma (оффлайн) | PWA + Serwist service worker + локальные EPUB | ✅ Готово |
| 10 | Metin Paylaşımı (шаринг текста) | saveFile с share опцией (Tauri sharekit) | ✅ Готово |
| 11 | Cihazlar Arası Senkronizasyon | CRDT replica sync (books + configs + annotations) | ✅ Готово |
| 12 | Şifresiz Giriş (беспарольный вход) | Supabase Google OAuth + magic link | ✅ Готово |
| 13 | Sayfaya Atla (перейти к странице) | ProgressBar + page navigation + TOC | ✅ Готово |
| 14 | Hızlı Gezinme (быстрая навигация) | TOCView + search within book + go-to-page | ✅ Готово |
| 15 | Disleksi Dostu Yazı Tipi | OpenDyslexic в списке системных шрифтов | 🟡 Нужно добавить |
| 16 | Ücretsiz ve Reklamsız | Open source (AGPL) | ✅ Готово |
| 17 | Hızlı Çıkış (ESC — выход из режима) | Keyboard shortcuts system | ✅ Готово |
| 18 | Metni Hizalayın (выравнивание текста) | textAlign, justification в LayoutPanel | ✅ Готово |

### 🔧 Нужно доделать/улучшить

| # | Функция eRisale | Что нужно сделать | Приоритет |
|---|---|---|---|
| 19 | Külliyat Araması (полнотекстовый поиск) | Нужен full-text search engine (SQLite FTS5 или Meilisearch) | 🔴 Высокий |
| 20 | Dahili Sözlük (встроенный словарь) | RisaleLugatProvider + Ottoman→Russian/Turkish словарь | 🔴 Высокий |
| 21 | Sözlük Seviyesi (уровень словаря) | Фильтр по уровню сложности слов | 🟡 Средний |
| 22 | Dipnotlar ve Meallar (сноски + переводы аятов) | Haşiye transformer + popup (уже в дизайне) | 🔴 Высокий |
| 23 | Sayfa Notu (заметка на всю страницу) | BookNote без CFI, только page reference | 🟢 Низкий |
| 24 | Notlarınızı Etiketleyin (теги для заметок) | Добавить tags[] в BookNote | 🟡 Средний |
| 25 | Hatt‑ı Kur'ân ile Okuma (османский шрифт) | Добавить османские шрифты в FontPanel | 🟡 Средний |
| 26 | Arapça/Farsça Metin Detayları (всплывашки) | Lugat popup для арабских/фарси фраз | 🔴 Высокий |
| 27 | İşareti Kaldırın (ластик для отметок) | UI для удаления отдельных highlight'ов | 🟢 Низкий |
| 28 | Yeni Sekmede Aç (открыть в новой вкладке) | Long-press на книге → новый BooksGrid | 🟡 Средний |
| 29 | Sekmeleri Geri Getirin (восстановить вкладки) | История закрытых книг | 🟢 Низкий |
| 30 | Eski Notlarınızı Taşıyın (импорт старых заметок) | Миграция из старого eRisale (специфично) | 🟢 Низкий |

### 🆕 У нас будет такого, чего нет у eRisale

| # | Наша уникальная фишка | Почему это круче |
|---|---|---|
| 1 | **Native desktop/mobile (Tauri)** | Не PWA, а настоящее приложение с файловой системой |
| 2 | **EPUB 3 со встроенными аннотациями** | Книги — отдельные файлы, не привязаны к сайту |
| 3 | **Параллельный перевод (2 книги side-by-side)** | Оригинал + перевод одновременно |
| 4 | **AI-ассистент (AI Chat с книгой)** | Задаёшь вопрос — получаешь ответ из Рисале |
| 5 | **Многослойные аннотации** | Хашие, люгат, авторские заметки — включай/выключай слои |
| 6 | **CRDT-based sync** | Real-time коллаборация без конфликтов |
| 7 | **KOReader плагин** | Чтение на e-ink устройствах (Kobo, Kindle, PocketBook) |
| 8 | **Proofread rules** | Пользовательские правила замены текста |
| 9 | **Custom fonts + embedded fonts** | Любой османский/арабский шрифт |
| 10 | **Protected встроенные книги** | Нельзя удалить, всегда с тобой |
| 11 | **TTS + голосовое чтение** | Встроенный text-to-speech |
| 12 | **Offline-first с локальными EPUB** | Не нужен интернет вообще, не только PWA cache |
| 13 | **CI/CD автообновление книг** | Новые версии книг с исправлениями через sync |

## 3. Архитектурные уроки из eRisale

### Что у них хорошо сделано:

1. **Встроенный контент** — книги хранятся прямо в коде приложения как HTML/Markdown. Нет импорта, нет отдельных файлов. Книга = часть приложения.

   **Для нас:** Мы можем пойти дальше — EPUB в `src-tauri/resources/` + автоимпорт при первом запуске.

2. **Словарь как first-class citizen** — не плагин, а часть ридера. Уровни сложности, османская орфография, цветовые подсказки.

   **Для нас:** `RisaleLugatProvider` с CustomDictionaryProvider API.

3. **Умный поиск с контекстом** — поиск по всей коллекции с фильтрацией по книгам.

   **Для нас:** Нужен полнотекстовый индекс. SQLite FTS5 (через Turso) или отдельный Meilisearch/TypeSense.

4. **Нативные попапы для аятов** — при тапе на арабский текст показывается перевод + тафсир.

   **Для нас:** Haşiye transformer (уже в плане) + lugat popup.

5. **Османский шрифт (Hatt-ı Kur'ân)** — переключение между латиницей и османской графикой.

   **Для нас:** Встроенные шрифты в EPUB + переключение writing-mode/view в настройках.

6. **Простой UI без меню** — всё через иконки и контекстные действия.

   **Для нас:** У нас уже хороший UI (daisyUI + Radix), можно добавить "easy access menu" как у них.

### Что можно улучшить по сравнению с eRisale:

1. **Оффлайн** — у них PWA с ограниченным кешем. У нас: настоящие EPUB-файлы + Turso SQLite.
2. **Скорость** — их поиск идёт на сервер. У нас можно сделать локальный FTS5 поиск.
3. **Аннотации** — у них только user notes. У нас: многослойная система.
4. **Десктоп** — у них только web/PWA. У нас: Tauri native на всех платформах.
5. **E-ink** — у нас KOReader плагин для читалок.
6. **AI** — у нас будет AI-ассистент работающий с текстом Рисале.
7. **Формат книг** — у них HTML в коде (трудно обновлять). У нас EPUB (стандарт, легко генерировать/обновлять).

## 4. Приоритетный roadmap (обновлённый)

### Этап 0: фундамент (то что уже есть)
- [x] EPUB reader (foliate-js)
- [x] Tauri desktop/mobile
- [x] Cloud sync (Supabase + R2)
- [x] Annotations + highlights
- [x] Themes + fonts
- [x] Multi-book view (BooksGrid)
- [x] Dictionary providers (StarDict/MDict/Slob)
- [x] KOReader plugin

### Этап 1: рисале-специфичные функции (MVP)
- [ ] Protected/built-in книги
- [ ] EPUB annotation extractor
- [ ] Полнотекстовый поиск по коллекции (SQLite FTS5)
- [ ] RisaleLugatProvider (османский словарь)
- [ ] Haşiye popup (аят-комментарии)
- [ ] Османские/арабские шрифты в комплекте

### Этап 2: продвинутый опыт
- [ ] Параллельный перевод (dual-book CFI sync)
- [ ] Многослойные аннотации (layer toggle UI)
- [ ] Авторские примечания (protected annotations)
- [ ] Sözlük seviyesi (уровни словаря)
- [ ] AI-ассистент (RAG over Risale corpus)

### Этап 3: экосистема
- [ ] EPUB generator tools
- [ ] CI/CD автосборка книг
- [ ] Мобильные приложения (Google Play + App Store)
- [ ] Сообщество: пользовательские аннотации, шаринг
