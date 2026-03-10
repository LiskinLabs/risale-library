const fs = require('fs');
const http = require('http');

const bookJson = 'Risale_Library_Extracted/rnk_asamusa_2018.json';
const outputFile = 'src/content/risale/tr/asamusa.mdx';
const progressFile = 'ai_progress.log';

const data = JSON.parse(fs.readFileSync(bookJson, 'utf8'));
const pages = data.pages;

const MODEL = "deepseek-v3.1:671b-cloud";

function wordDiff(oldText, newText) {
    if (!newText) return "<del>AI returned no text</del>";
    const oldWords = oldText.split(/\s+/);
    const newWords = newText.split(/\s+/);
    let result = '';
    
    newWords.forEach(word => {
        if (!oldText.includes(word)) {
            result += `<ins>${word}</ins> `;
        } else {
            result += word + ' ';
        }
    });
    return result;
}

async function askAI(text) {
    const prompt = `You are an expert Risale-i Nur editor. Fix formatting, punctuation and spelling in Turkish.
    RULES:
    1. Fix punctuation and add missing spaces.
    2. Join broken lines within sentences.
    3. Remove technical chars like \\ or ∑.
    4. PRESERVE ALL <span> TAGS AND ARABIC TEXT EXACTLY.
    5. Return ONLY fixed text.
    
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
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.error) reject(new Error(parsed.error));
                    else resolve(parsed.response);
                } catch (e) { reject(new Error("Invalid JSON from AI")); }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function run() {
    let resultMarkdown = `---\ntitle: 'Asâ-yı Musa (AI Corrected)'\nbook: 'asamusa'\n---\nimport QuranText from '../../../components/reader/QuranText';\n\n`;
    const chunkSize = 2; // Reduced to 2 pages for stability
    const testLimit = 4; // Just 4 pages for ultra-fast test
    
    fs.writeFileSync(progressFile, `AI Test Run (4 pages)\n`);

    for (let i = 0; i < testLimit; i += chunkSize) {
        const chunk = pages.slice(i, i + chunkSize).map(p => p.content).join('\n\n');
        console.log(`Processing chunk ${i}...`);
        
        try {
            const perfected = await askAI(chunk);
            if (perfected) {
                const highlighted = wordDiff(chunk, perfected);
                resultMarkdown += highlighted + "\n\n";
                fs.appendFileSync(progressFile, `Chunk ${i/chunkSize + 1} Done\n`);
            } else {
                throw new Error("AI returned empty response");
            }
        } catch (e) {
            fs.appendFileSync(progressFile, `Error: ${e.message}\n`);
        }
    }
    fs.writeFileSync(outputFile, resultMarkdown, 'utf8');
    fs.appendFileSync(progressFile, `FINISHED\n`);
}
run();
