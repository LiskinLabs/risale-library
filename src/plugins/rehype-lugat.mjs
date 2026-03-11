import { visit } from 'unist-util-visit';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let lugatData = null;
let lugatRegex = null;

function loadLugat() {
  if (lugatData) return;
  try {
    const filePath = resolve(process.cwd(), 'src/data/lugat_full.json');
    const content = readFileSync(filePath, 'utf-8');
    lugatData = JSON.parse(content);
    
    // Сортируем слова от самых длинных к коротким, чтобы "ehl-i dalâlet" не съедалось словом "dalâlet"
    const words = Object.keys(lugatData).sort((a, b) => b.length - a.length);
    
    // Создаем одно регулярное выражение для всех слов. 
    // Используем границы слов \b для точности, но учитываем турецкие символы и дефисы.
    // Регулярка для турецких слов с дефисами: (?<![\w\u00C0-\u017F-])(СЛОВО)(?![\w\u00C0-\u017F-])
    const pattern = words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    lugatRegex = new RegExp(`(?<![\\w\\u00C0-\\u017F-])(${pattern})(?![\\w\\u00C0-\\u017F-])`, 'gi');
  } catch (e) {
    console.error('Failed to load lugat_full.json:', e);
    lugatData = {};
  }
}

export function rehypeLugat() {
  loadLugat();

  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      // Не обрабатываем текст внутри ссылок, кодов или уже размеченных элементов
      if (!parent || ['a', 'code', 'pre', 'span'].includes(parent.tagName)) return;

      const matches = node.value.matchAll(lugatRegex);
      const newChildren = [];
      let lastIndex = 0;

      for (const match of matches) {
        const word = match[0];
        const matchIndex = match.index;
        
        // Добавляем текст до совпадения
        if (matchIndex > lastIndex) {
          newChildren.push({ type: 'text', value: node.value.slice(lastIndex, matchIndex) });
        }

        // Находим значение слова (без учета регистра)
        const lowerWord = word.toLowerCase();
        // Ищем в словаре (ключи в нижнем регистре для надежности)
        let meaning = lugatData[word] || lugatData[lowerWord];
        
        // Если не нашли прямо, ищем через перебор (только если слов не слишком много)
        if (!meaning) {
          const key = Object.keys(lugatData).find(k => k.toLowerCase() === lowerWord);
          if (key) meaning = lugatData[key];
        }

        if (meaning) {
          // Добавляем узел спана с данными словаря
          newChildren.push({
            type: 'element',
            tagName: 'span',
            properties: {
              className: ['lugat-word'],
              'data-meaning': meaning,
              'data-word': word
            },
            children: [{ type: 'text', value: word }]
          });
        } else {
          newChildren.push({ type: 'text', value: word });
        }

        lastIndex = matchIndex + word.length;
      }

      // Добавляем оставшийся текст
      if (lastIndex < node.value.length) {
        newChildren.push({ type: 'text', value: node.value.slice(lastIndex) });
      }

      // Если были замены, обновляем родительский узел
      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
        return [visit.SKIP, index + newChildren.length];
      }
    });
  };
}
