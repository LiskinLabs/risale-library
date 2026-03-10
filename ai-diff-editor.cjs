const fs = require('fs');
const http = require('http');

const bookJson = 'Risale_Library_Extracted/rnk_asamusa_2018.json';
const outputFile = 'src/content/risale/tr/asamusa.md';
const progressFile = 'ai_progress.log';

const data = JSON.parse(fs.readFileSync(bookJson, 'utf8'));
const pages = data.pages;
const totalPages = pages.length;

const MODEL = "deepseek-v3.1:671b-cloud";

// Surgical word-diff to highlight changes in green
function generateVisualDiff(oldText, newText) {
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    let result = '';
    
    newWords.forEach(word => {
        // Skip diffing for HTML tags
        if (word.includes('<span') || word.includes('</span>') || word.includes('data-translation')) {
            result += word + ' ';
            return;
        }
        // If word is new or changed, wrap in green highlight
        if (!oldText.includes(word)) {
            result += `<ins style="background: #dcfce7; color: #166534; text-decoration: none; padding: 0 2px; border-radius: 2px;">${word}</ins> `;
        } else {
            result += word + ' ';
        }
    });
    return result;
}

async function askAI(text) {
    const prompt = `You are a professional editor for Risale-i Nur. 
    YOUR TASK: Perfect the Turkish text and Arabic spelling.
    
    RULES:
    1. ARABIC FIX: Change "بِاسْمِه۪" to "بِاسْمِهِ" (fix the 'he' vowel) everywhere.
    2. CLEANING: Remove markers like \\, _, €, †, ÷, ∑, §, >. Remove symbol ۝.
    3. STYLE: Use '<span class="quran-text font-arabic text-2xl text-amber-700 dark:text-amber-500 leading-loose hover:bg-amber-100 dark:hover:bg-amber-900/30 px-1 rounded transition-colors cursor-help relative group" data-translation="TRANS">ARABIC</span>' for ALL Arabic.
    4. TURKISH: Fix punctuation, missing spaces, and join broken lines. Split concatenated words like 'hakikatininbeş'.
    5. FORMATTING: Use '## HEADER' for titles.
    6. OUTPUT: Return ONLY the corrected text. No chat.
    
    TEXT:
    ${text}`;

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ model: MODEL, prompt: prompt, stream: false });
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
    let resultMarkdown = `---\ntitle: 'Asâ-yı Musa (AI REVISION)'\nbook: 'asamusa'\n---\n\n`;
    const chunkSize = 5; 

    fs.writeFileSync(progressFile, `AI FULL REVISION STARTED: Asâ-yı Musa\nTotal Pages: ${totalPages}\n`);

    for (let i = 0; i < totalPages; i += chunkSize) {
        const chunkArr = pages.slice(i, i + chunkSize);
        const chunkText = chunkArr.map(p => p.content).join(' ');
        
        console.log(`Processing ${i + 1} to ${i + chunkArr.length}...`);
        
        try {
            const perfected = await askAI(chunkText);
            const diffed = generateVisualDiff(chunkText, perfected);
            resultMarkdown += diffed + "\n\n";
            
            const progress = Math.round(((i + chunkArr.length) / totalPages) * 100);
            fs.appendFileSync(progressFile, `[${new Date().toLocaleTimeString()}] Progress: ${progress}% (${i + chunkArr.length}/${totalPages})\n`);
        } catch (e) {
            fs.appendFileSync(progressFile, `ERROR at page ${i+1}: ${e.message}\n`);
        }
    }

    fs.writeFileSync(outputFile, resultMarkdown, 'utf8');
    fs.appendFileSync(progressFile, `COMPLETED. File: ${outputFile}\n`);
}

run();
