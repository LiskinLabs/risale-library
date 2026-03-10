const fs = require('fs');
const http = require('http');
const path = require('path');

const inputFolder = 'Risale_Library_Extracted';
const outputFolder = 'src/content/risale/tr';
const progressFile = 'ai_correction_log.md';

const MODEL = "deepseek-v3.1:671b-cloud";

const bookTitles = {
  'sozler': 'Sözler',
  'mektubat': 'Mektubat',
  'lemalar': 'Lem\'alar',
  'sualar': 'Şualar',
  'asamusa': 'Asâ-yı Musa',
  'tarihce': 'Tarihçe-i Hayatı',
  'barla': 'Barla Lâhikası',
  'kastamonu': 'Kastamonu Lâhikası',
  'emirdag1': 'Emirdağ Lâhikası 1',
  'emirdag2': 'Emirdağ Lâhikası 2',
  'sikke': 'Sikke-i Tasdik-i Gaybî',
  'muhakemat': 'Muhakemat',
  'mesnevi': 'Mesnevî-i Nuriye',
  'isarat': 'İşaratü\'l-İ\'caz',
  'imankufur': 'Asâ-yı Musa (İman-Küfür)',
};

async function askAI(text) {
    const prompt = `You are a world-class Turkish editor for the Risale-i Nur collection.
    TASK: Clean and perfect the text.
    
    RULES:
    1. ARABIC: Replace "بِاسْمِه۪" with "بِاسْمِهِ". Style ALL Arabic text with: <span class="quran-text font-arabic text-2xl text-amber-700" data-translation="TRANS">ARABIC</span>.
    2. CLEANING: Remove ALL technical database markers: \\, _, €, †, ÷, ∑, §, >. Remove ۝.
    3. TURKISH: Join broken sentences across pages. Fix spacing and punctuation. Fix concatenated words.
    4. STRUCTURE: Keep paragraphs. Use '## HEADER' for titles.
    5. OUTPUT: Return ONLY the cleaned Turkish/Arabic text. No explanations. No thinking blocks.
    
    TEXT:
    ${text}`;

    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ model: MODEL, prompt: prompt, stream: false });
        const options = { hostname: 'localhost', port: 11434, path: '/api/generate', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body).response;
                    // Filter out any potential AI thinking leaks
                    const cleaned = response.replace(/<｜.*?｜>/gs, '').trim();
                    resolve(cleaned);
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function processBook(fileName) {
    const bookId = fileName.replace('rnk_', '').replace('_2018.json', '').replace(/_/g, '-');
    const data = JSON.parse(fs.readFileSync(path.join(inputFolder, fileName), 'utf8'));
    const pages = data.pages;
    const totalPages = pages.length;
    
    fs.appendFileSync(progressFile, `\n### 📖 Обработка: ${bookTitles[bookId] || bookId}\n`);
    console.log(`Processing ${bookId}...`);

    let resultMarkdown = `---\ntitle: '${(bookTitles[bookId] || bookId).replace(/'/g, "''")}'\nbook: '${bookId}'\n---\n\n`;
    const chunkSize = 5;

    for (let i = 0; i < totalPages; i += chunkSize) {
        const chunk = pages.slice(i, i + chunkSize).map(p => p.content).join(' ');
        try {
            const perfected = await askAI(chunk);
            resultMarkdown += perfected + "\n\n";
            const percent = Math.round(((i + chunk.length) / totalPages) * 100);
            fs.appendFileSync(progressFile, `- [${new Date().toLocaleTimeString()}] Стр. ${i+1}-${i+chunkSize} из ${totalPages} (Готово)\n`);
        } catch (e) {
            fs.appendFileSync(progressFile, `- [${new Date().toLocaleTimeString()}] ОШИБКА на стр. ${i+1}: ${e.message}\n`);
        }
    }

    const outputFilePath = path.join(outputFolder, `${bookId}.md`);
    fs.writeFileSync(outputFilePath, resultMarkdown, 'utf8');
}

async function run() {
    fs.writeFileSync(progressFile, `# Лог ИИ-коррекции библиотеки\nЗапущено: ${new Date().toLocaleString()}\n`);
    
    const files = fs.readdirSync(inputFolder).filter(f => f.startsWith('rnk_') && !f.endsWith('F.json'));
    
    for (const file of files) {
        await processBook(file);
    }
    
    fs.appendFileSync(progressFile, `\n\n## ✅ ПОЛНОЕ ЗАВЕРШЕНИЕ: ${new Date().toLocaleString()}\n`);
}

run();
