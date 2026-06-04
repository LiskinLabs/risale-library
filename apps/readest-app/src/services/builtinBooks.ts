import type { Book } from '@/types/book';

export interface BuiltinBookEntry {
  filename: string;
  title: string;
  author: string;
  language: string;
  group: 'risale' | 'nur';
  url?: string;
  coverFilename?: string;
}

export const BUILTIN_BOOKS: BuiltinBookEntry[] = [
  {
    filename: 'sozler.epub',
    title: 'Sözler',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'mektubat.epub',
    title: 'Mektubat',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'lemalar.epub',
    title: "Lem'alar",
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'sualar.epub',
    title: 'Şuâlar',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'tarihce-i-hayat.epub',
    title: 'Tarihçe-i Hayat',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'mesnevi-i-nuriye.epub',
    title: 'Mesnevî-i Nuriye',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'isaratul-icaz.epub',
    title: "İşaratü'l-i'caz",
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'sikke-i-tasdik-i-gaybi.epub',
    title: 'Sikke-i Tasdik-i Gaybî',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'barla-lahikasi.epub',
    title: 'Barla Lâhikası',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'kastamonu-lahikasi.epub',
    title: 'Kastamonu Lâhikası',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'emirdag-lahikasi-1.epub',
    title: 'Emirdağ Lâhikası 1',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'emirdag-lahikasi-2.epub',
    title: 'Emirdağ Lâhikası 2',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'asa-yi-musa.epub',
    title: 'Asâ-yı Musa',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'muhakemat.epub',
    title: 'Muhakemat',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'risale',
  },
  {
    filename: 'kucuk-kitaplar.epub',
    title: 'Küçük Kitaplar',
    author: 'Bediüzzaman Said Nursi',
    language: 'tr',
    group: 'nur',
  },
];

export function getBuiltinBooksBaseUrl(): string {
  if (typeof window !== 'undefined') return `${window.location.origin}/builtin-books`;
  return process.env['NEXT_PUBLIC_BUILTIN_BOOKS_URL'] || 'http://localhost:3000/builtin-books';
}

export const BUILTIN_BOOKS_BASE_URL = '/builtin-books';
export function isBuiltinBook(book: Book): boolean {
  return book.builtin === true;
}
export function findBuiltinEntry(book: Book): BuiltinBookEntry | undefined {
  return BUILTIN_BOOKS.find(
    (entry) => book.builtin && (book.title === entry.title || book.sourceTitle === entry.filename),
  );
}
