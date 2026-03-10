const fs = require('fs');
const http = require('http');

const bookJson = 'Risale_Library_Extracted/rnk_asamusa_2018.json';
const outputFile = 'src/content/risale/tr/asamusa.mdx';
const progressFile = 'ai_progress.log';

const data = JSON.parse(fs.readFileSync(bookJson, 'utf8'));
const pages = data.pages;
const totalPages = pages.length;

const MODEL = "deepseek-v3.1:671b-cloud";

async function askAI(text) {
    const prompt = `You are a professional Turkish editor. 
Your task is to fix formatting and punctuation in the Risale-i Nur text.
RULES:
1. Fix punctuation, broken words, and missing spaces.
2. Remove technical markers (\\, _, €, etc.).
3. Format headers like '## HEADER' and bold important religious terms.
4. Join split sentences.
5. PRESERVE Arabic text and hover tags exactly as they are (~arabic|trans@).
6. Return ONLY the perfected text. No comments.

TEXT TO PERFECT:
${text}`;

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            model: MODEL,
            prompt: prompt,
            stream: false
        });

        const options = {
            hostname: 'localhost',
            port: 11434,
            path: '/api/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(JSON.parse(body).response));
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

// Simple Diff implementation: Wrap differences in <ins> and <del>
function generateDiff(oldText, newText) {
    // For large texts, we'll do a simplified line-by-line or word-by-word comparison
    // To keep it readable on the site, we'll show the new text but highlight what AI added/changed
    // For this test, we'll just return the newText but we can improve this later.
    return newText; 
}

async function run() {
    let resultMarkdown = `---
title: 'Asâ-yı Musa (AI Corrected)'
book: 'asamusa'
---

import QuranText from '../../../components/reader/QuranText';

`;

    const chunkSize = 5;
    fs.writeFileSync(progressFile, `Starting AI Correction for Asâ-yı Musa...\nTotal Pages: ${totalPages}\n`);

    for (let i = 0; i < 10; i += chunkSize) { // Test first 10 pages
        const chunk = pages.slice(i, i + chunkSize).map(p => p.content).join('\n\n');
        console.log(`Processing pages ${i + 1} to ${i + chunkSize}...`);
        
        try {
            const perfected = await askAI(chunk);
            resultMarkdown += perfected + "\n\n";
            
            const progress = Math.round(((i + chunkSize) / 10) * 100);
            fs.appendFileSync(progressFile, `[${new Date().toLocaleTimeString()}] Processed ${i + chunkSize} / 10 pages (${progress}%)\n`);
        } catch (e) {
            console.error("AI Error:", e.message);
            fs.appendFileSync(progressFile, `Error at page ${i + 1}: ${e.message}\n`);
        }
    }

    fs.writeFileSync(outputFile, resultMarkdown, 'utf8');
    fs.appendFileSync(progressFile, `FINISHED. File saved to ${outputFile}\n`);
}

run();
