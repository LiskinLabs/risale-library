/**
 * Vecize (Aphorism) Service — curated quotes from Risale-i Nur.
 *
 * Used by the Quote of the Day widget on the library home screen.
 * Quotes are from the 15 core Risale books, extracted from the
 * kitaplar corpus and Diyanet text.
 */

export interface Vecize {
  id: string;
  text: string;
  book: string;
  section?: string;
  author?: string;
}

/** Curated quotes from Risale-i Nur — expand via tools/import-vecize.py */
export const VECIZELER: Vecize[] = [
  // ── Sözler ──
  { id: 's-01', text: 'Bismillah her hayrın başıdır.', book: 'Sözler', section: 'Birinci Söz' },
  {
    id: 's-02',
    text: "Her şey, Cenab-ı Hakk'ın namına hareket eder.",
    book: 'Sözler',
    section: 'Birinci Söz',
  },
  {
    id: 's-03',
    text: 'Aczini ve fakrını anlayan, nihayetsiz kudret ve rahmete ulaşır.',
    book: 'Sözler',
    section: 'Birinci Söz',
  },
  {
    id: 's-04',
    text: 'Biz, dini siyasete âlet değil; belki siyaseti dine âlet ve dost yapmakla mükellefiz.',
    book: 'Sözler',
    section: 'On Dördüncü Söz',
  },
  {
    id: 's-05',
    text: "Kâinat bir kitab-ı kebirdir; her bir harfi kendi zatına delâlet ettiği gibi, Sâni'ini de gösterir.",
    book: 'Sözler',
    section: 'Onuncu Söz',
  },
  {
    id: 's-06',
    text: 'Amelinizde rıza-yı İlahî olmalı. Eğer o razı olsa, bütün dünya küsse ehemmiyeti yok.',
    book: 'Sözler',
    section: 'Yirmi Birinci Söz',
  },

  // ── Mektubat ──
  {
    id: 'm-01',
    text: 'Bu dünya bir misafirhanedir. Misafir, kendisine verilen vazifeye göre hareket etmelidir.',
    book: 'Mektubat',
    section: 'Birinci Mektup',
  },
  {
    id: 'm-02',
    text: 'Hayat, bir yolculuktur; her gün bir menzildir.',
    book: 'Mektubat',
    section: 'İkinci Mektup',
  },
  {
    id: 'm-03',
    text: 'En mühim vazife, imanı kurtarmak ve tahkiki imanı elde etmektir.',
    book: 'Mektubat',
    section: 'On Dokuzuncu Mektup',
  },

  // ── Lem\'alar ──
  {
    id: 'l-01',
    text: "Ümitvar olunuz. Şu istikbal inkılabatı içinde en yüksek gür sadâ, İslâm'ın sadâsı olacaktır.",
    book: "Lem'alar",
    section: "On Dokuzuncu Lem'a",
  },
  {
    id: 'l-02',
    text: "Her bir zîhayat, bir kaside-i maneviyedir ki Sâni'-i Zülcelal'i terennüm eder.",
    book: "Lem'alar",
    section: "Birinci Lem'a",
  },

  // ── Şuâlar ──
  {
    id: 'su-01',
    text: 'Kâinatta hiçbir şey tesadüf ile olamaz. Her şey bir nizam ve mizan iledir.',
    book: 'Şuâlar',
    section: 'Birinci Şuâ',
  },
  {
    id: 'su-02',
    text: 'İman, insanı insan eder; belki sultan eder.',
    book: 'Şuâlar',
    section: 'İkinci Şuâ',
  },
  {
    id: 'su-03',
    text: 'İnsanın en yüksek mertebesi, iman-ı billah ve marifetullahtır.',
    book: 'Şuâlar',
    section: 'Yedinci Şuâ',
  },

  // ── Tarihçe-i Hayat ──
  {
    id: 't-01',
    text: "Bu zamanda ehl-i İslâm'ın en mühim vazifesi, imanlarını kurtarmaktır.",
    book: 'Tarihçe-i Hayat',
    section: 'İlk Hayatı',
  },
  {
    id: 't-02',
    text: "Risale-i Nur, bu asrın manevî hastalıklarına Kur'an'ın eczanesinden alınmış bir reçetedir.",
    book: 'Tarihçe-i Hayat',
    section: 'Barla Hayatı',
  },

  // ── Mesnevî-i Nuriye ──
  {
    id: 'mn-01',
    text: "Marîz bir asrın, hasta bir unsurun, alîl bir uzvun reçetesi; ittiba-ı Kur'an'dır.",
    book: 'Mesnevî-i Nuriye',
  },
  { id: 'mn-02', text: "Kâinatın en hakiki güneşi, Kur'an'dır.", book: 'Mesnevî-i Nuriye' },

  // ── Asâ-yı Musa ──
  {
    id: 'am-01',
    text: "Risale-i Nur, Kur'an-'ın bu asırda bir mu'cize-i maneviyesidir.",
    book: 'Asâ-yı Musa',
  },
  {
    id: 'am-02',
    text: 'Şu kâinat öyle bir saraydır ki, her şey içinde bir hakikati gösterir.',
    book: 'Asâ-yı Musa',
    section: 'Birinci Hüccet-i İmaniye',
  },

  // ── Gençlik Rehberi (Küçük Kitaplar) ──
  {
    id: 'gr-01',
    text: 'Ey genç! İleride seni çok bekleyen kabir var. Kabir kapısını kapayan yok.',
    book: 'Gençlik Rehberi',
  },
  {
    id: 'gr-02',
    text: 'Bu dünya bir eğlence ve oyun yeri değil; bir imtihan meydanıdır.',
    book: 'Gençlik Rehberi',
  },

  // ── Hutbe-i Şamiye ──
  {
    id: 'hs-01',
    text: "Bizim düşmanımız cehalet, zaruret, ihtilaftır. Bu üç düşmana karşı san'at, marifet, ittifak silahıyla cihad edeceğiz.",
    book: 'Hutbe-i Şamiye',
  },

  // ── Münazarat ──
  {
    id: 'mz-01',
    text: "Bu milletin en büyük ihtiyacı, İslâmiyet'in hakikatlerini asrın anlayacağı bir dille ders vermektir.",
    book: 'Münazarat',
  },
];

/**
 * Get a random quote from the collection.
 * Optionally filter by book.
 */
export function getRandomQuote(bookFilter?: string): Vecize {
  const pool = bookFilter ? VECIZELER.filter((v) => v.book === bookFilter) : VECIZELER;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? VECIZELER[0]!;
}

/**
 * Get a quote by ID.
 */
export function getQuoteById(id: string): Vecize | undefined {
  return VECIZELER.find((v) => v.id === id);
}

/**
 * Get today's quote — deterministic based on date, changes daily.
 */
export function getDailyQuote(): Vecize {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  const idx = dayOfYear % VECIZELER.length;
  return VECIZELER[idx] ?? VECIZELER[0]!;
}
