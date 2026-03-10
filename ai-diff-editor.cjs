const fs = require('fs');
const http = require('http');

const bookJson = 'Risale_Library_Extracted/rnk_asamusa_2018.json';
const outputFile = 'src/content/risale/tr/asamusa.md';
const progressFile = 'ai_progress.log';

const data = JSON.parse(fs.readFileSync(bookJson, 'utf8'));
const pages = data.pages;

const MODEL = "deepseek-v3.1:671b-cloud";

// Improved word-level diff that ignores HTML tags logic
function generateDiff(oldText, newText) {
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    let result = '';
    
    // Simple visualization: focus on what AI added/changed
    newWords.forEach(word => {
        if (word.includes('<span') || word.includes('</span>') || word.includes('data-translation')) {
            result += word + ' '; // Don't diff HTML tags
            return;
        }
        if (!oldText.includes(word)) {
            result += `<ins>${word}</ins> `;
        } else {
            result += word + ' ';
        }
    });
    return result;
}

async function askAI(text) {
    const prompt = `You are an expert Risale-i Nur editor. 
    RULES:
    1. Clean all symbols: \\, _, €, †, ÷, ∑, §, >. Remove ۝.
    2. Style ALL Arabic text with: <span class="quran-text font-arabic text-2xl text-amber-700 dark:text-amber-500 leading-loose hover:bg-amber-100 dark:hover:bg-amber-900/30 px-1 rounded transition-colors cursor-help relative group" data-translation="">ARABIC</span>
    3. Fix punctuation and concatenated words.
    4. Join broken lines.
    5. Return ONLY fixed text.`;

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ model: MODEL, prompt: `TEXT TO FIX:\n${text}\n\n${prompt}`, stream: false });
        const options = {
            hostname: 'localhost', port: 11434, path: '/api/generate', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body).response); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function run() {
    let resultMarkdown = `---\ntitle: 'Asâ-yı Musa (AI REVISION MODE)'\nbook: 'asamusa'\n---\n\n`;
    const testLimit = 6; // Process 6 pages for a visible test
    const chunkSize = 2; 

    fs.writeFileSync(progressFile, `AI Visual Diff Test Started...\n`);

    for (let i = 0; i < testLimit; i += chunkSize) {
        const chunk = pages.slice(i, i + chunkSize).map(p => p.content).join(' ');
        try {
            const perfected = await askAI(chunk);
            const diffed = generateDiff(chunk, perfected);
            resultMarkdown += diffed + "\n\n";
            fs.appendFileSync(progressFile, `Chunk ${i/chunkSize + 1} Done\n`);
        } catch (e) {
            fs.appendFileSync(progressFile, `Error: ${e.message}\n`);
        }
    }
    fs.writeFileSync(outputFile, resultMarkdown, 'utf8');
    fs.appendFileSync(progressFile, `FINISHED. Check Asâ-yı Musa page.\n`);
}
run();
