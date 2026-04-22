import { visit } from 'unist-util-visit';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let lugatData = null;
let lugatKeysLower = null;

function loadLugat() {
  if (lugatData) return;
  try {
    const filePath = resolve(process.cwd(), 'src/data/lugat_full.json');
    const content = readFileSync(filePath, 'utf-8');
    lugatData = JSON.parse(content);
    
    lugatKeysLower = new Map();
    for (const key of Object.keys(lugatData)) {
      lugatKeysLower.set(key.toLowerCase(), key);
    }
  } catch (e) {
    console.error('Failed to load lugat_full.json:', e);
    lugatData = {};
    lugatKeysLower = new Map();
  }
}

// Tokenizes text into words and non-words.
// Captures words containing letters, letters with diacritics, hyphens, and apostrophes.
const tokenizer = /([\w\u00C0-\u017F\-'’]+)|([^\w\u00C0-\u017F\-'’]+)/g;

export function rehypeLugat() {
  loadLugat();

  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      // Do not process text inside links, code, or already marked spans
      if (!parent || ['a', 'code', 'pre', 'span'].includes(parent.tagName)) return;

      const text = node.value;
      if (!text || text.trim() === '') return;

      const newChildren = [];
      let hasReplacements = false;

      // Reset lastIndex for the global regex
      tokenizer.lastIndex = 0;
      let match;
      while ((match = tokenizer.exec(text)) !== null) {
        const word = match[1];
        const nonWord = match[2];

        if (word) {
          const lowerWord = word.toLowerCase();
          let meaning = lugatData[word] || lugatData[lowerWord];
          
          if (!meaning && lugatKeysLower.has(lowerWord)) {
             meaning = lugatData[lugatKeysLower.get(lowerWord)];
          }

          if (meaning) {
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
            hasReplacements = true;
          } else {
            newChildren.push({ type: 'text', value: word });
          }
        } else if (nonWord) {
          newChildren.push({ type: 'text', value: nonWord });
        }
      }

      if (hasReplacements) {
        // Optimize text nodes: join adjacent text nodes back together to keep the tree clean
        const optimizedChildren = [];
        for (const child of newChildren) {
          if (child.type === 'text' && optimizedChildren.length > 0 && optimizedChildren[optimizedChildren.length - 1].type === 'text') {
             optimizedChildren[optimizedChildren.length - 1].value += child.value;
          } else {
             optimizedChildren.push(child);
          }
        }

        parent.children.splice(index, 1, ...optimizedChildren);
        return [visit.SKIP, index + optimizedChildren.length];
      }
    });
  };
}
