const fs = require('fs');
const http = require('http');

const bookJson = 'Risale_Library_Extracted/rnk_asamusa_2018.json';
const outputFile = 'src/content/risale/tr/asamusa.mdx';
const progressFile = 'ai_progress.log';

const data = JSON.parse(fs.readFileSync(bookJson, 'utf8'));
const pages = data.pages;

const MODEL = "deepseek-v3.1:671b-cloud";

async function askAI(text) {
    const prompt = `You are an expert Risale-i Nur editor. 
Your goal is to make the text perfect for reading.
RULES:
1. Fix all punctuation and spelling.
2. Remove technical markers like \\, ∑, §, _, €, >.
3. Fix concatenated words (e.g. 'hakikatininbeş' -> 'hakikatinin beş').
4. Join sentences that are broken across lines.
5. IMPORTANT: Keep all <span ...>...</span> tags and Arabic text EXACTLY as they are. Do not modify them.
6. Format headers using Markdown (## HEADER).
7. Return ONLY the final corrected text. No explanations.

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
                    resolve(parsed.response);
                } catch (e) { reject(new Error("AI error")); }
            });
        });
        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function run() {
    let resultMarkdown = `---\ntitle: 'Asâ-yı Musa (AI Perfected)'\nbook: 'asamusa'\n---\nimport QuranText from '../../../components/reader/QuranText';\n\n`;
    
    // We will process 10 pages for this test
    const testLimit = 10;
    const chunkSize = 2; 

    fs.writeFileSync(progressFile, `Starting DeepSeek V3 Correction (10 pages)...\n`);

    for (let i = 0; i < testLimit; i += chunkSize) {
        const chunk = pages.slice(i, i + chunkSize).map(p => p.content).join(' ');
        console.log(`Processing ${i+1}...`);
        
        try {
            const perfected = await askAI(chunk);
            resultMarkdown += perfected + "\n\n";
            fs.appendFileSync(progressFile, `Processed pages ${i+1} to ${i+chunkSize}\n`);
        } catch (e) {
            fs.appendFileSync(progressFile, `Error: ${e.message}\n`);
        }
    }

    fs.writeFileSync(outputFile, resultMarkdown, 'utf8');
    fs.appendFileSync(progressFile, `DONE. Check the website.\n`);
}

run();
