const fs = require('fs');
const http = require('http');

const bookJson = 'Risale_Library_Extracted/rnk_asamusa_2018.json';
const outputFile = 'src/content/risale/tr/asamusa.md';

const data = JSON.parse(fs.readFileSync(bookJson, 'utf8'));
const pages = data.pages;

const MODEL = "deepseek-v3.1:671b-cloud";

function generateVisualDiff(oldText, newText) {
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    let result = '';
    newWords.forEach(word => {
        if (word.includes('<span') || word.includes('</span>') || word.includes('data-translation')) {
            result += word + ' ';
            return;
        }
        if (!oldText.includes(word)) {
            result += `<ins style="background: #dcfce7; color: #166534; text-decoration: none; padding: 0 2px; border-radius: 2px;">${word}</ins> `;
        } else {
            result += word + ' ';
        }
    });
    return result;
}

async function askAI(text) {
    const prompt = `You are a professional editor for Risale-i Nur. Perfect the Turkish and Arabic text.
    RULES:
    1. Fix "بِاسْمِه۪" to "بِاسْمِهِ".
    2. Clean markers: \\, _, €, †, ÷, ∑, §, >.
    3. Style Arabic with <span class="quran-text font-arabic text-2xl text-amber-700" data-translation="TRANS">ARABIC</span>.
    4. Fix punctuation and concatenated words.
    5. Return ONLY corrected text.`;

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ model: MODEL, prompt: `TEXT:\n${text}\n\n${prompt}`, stream: false });
        const options = { hostname: 'localhost', port: 11434, path: '/api/generate', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body).response));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function run() {
    let resultMarkdown = `---\ntitle: 'Asâ-yı Musa (AI REVISION)'\nbook: 'asamusa'\n---\n\n# Asâ-yı Musa\n\n`;
    const testLimit = 20; 
    const chunkSize = 5; 

    for (let i = 0; i < testLimit; i += chunkSize) {
        console.log(`Working on pages ${i+1}...`);
        const chunk = pages.slice(i, i + chunkSize).map(p => p.content).join(' ');
        const perfected = await askAI(chunk);
        resultMarkdown += generateVisualDiff(chunk, perfected) + "\n\n";
    }
    fs.writeFileSync(outputFile, resultMarkdown, 'utf8');
    console.log("DONE! File saved.");
}
run();
