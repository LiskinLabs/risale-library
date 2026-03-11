import os
import re

def log_progress(message):
    with open('ai_progress.log', 'a', encoding='utf-8') as f:
        f.write(message + '\n')
    print(message)

def correct_text(text):
    # 0. Fix accidental spaces in words and HTML tags introduced in previous runs
    # Target common words that were split, including those split by newlines
    text = text.replace('transiti on-colors', 'transition-colors')
    text = text.replace('translati on', 'translation')
    text = text.replace('quran-text f ont-arabic', 'quran-text font-arabic')
    text = text.replace('f ont-arabic', 'font-arabic')
    
    # Use regex to fix words split by space or newline
    text = re.sub(r'bi\s+r\b', 'bir', text)
    text = re.sub(r'hiç\s+bi\s+r\b', 'hiçbir', text)
    text = re.sub(r'hiç\s+bir\b', 'hiçbir', text)
    text = re.sub(r'\bs\s+on\b', 'son', text)
    text = re.sub(r'hak\s+iki\b', 'hakiki', text)
    text = re.sub(r'ka\s+bir\b', 'kabir', text)
    text = re.sub(r'vag\s+on\b', 'vagon', text)
    text = re.sub(r'mily\s+on\b', 'milyon', text)

    # 1. Clear technical symbols and fix glued words outside tags
    def replace_outside_tags(content):
        parts = re.split(r'(<[^>]+>)', content)
        for i in range(len(parts)):
            if not parts[i].startswith('<'):
                # Apply text corrections here
                
                # Clear technical symbols
                parts[i] = parts[i].replace(':>', ': ')
                parts[i] = parts[i].replace(',>', ', ')
                parts[i] = re.sub(r'[\\_∑†÷§]', '', parts[i])
                parts[i] = re.sub(r' +>+', ' ', parts[i])
                parts[i] = re.sub(r'([:,.])>+', r'\1 ', parts[i])
                
                # Fix glued Turkish words
                parts[i] = parts[i].replace('hakikatininbeş', 'hakikatinin beş')
                parts[i] = parts[i].replace('hakikatininon', 'hakikatinin on')
                parts[i] = parts[i].replace('hakikatininbir', 'hakikatinin bir')
                
                target_glued = ['hakikatinin', 'maddenin', 'manasının', 'ispat', 'rivayet']
                for word in target_glued:
                    parts[i] = re.sub(rf'({word})(beş|on|bir|bu|ve|her|o|şu)\b', r'\1 \2', parts[i], flags=re.IGNORECASE)
                
        return ''.join(parts)

    return replace_outside_tags(text)

def process_books(directory):
    files = [f for f in os.listdir(directory) if f.endswith('.md')]
    total = len(files)
    
    log_progress(f"AI FULL CORRECTION STARTED. Total files: {total}")
    
    for i, filename in enumerate(files):
        path = os.path.join(directory, filename)
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content = correct_text(content)
        
        if new_content != content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            log_progress(f"[{i+1}/{total}] Corrected: {filename}")
        else:
            log_progress(f"[{i+1}/{total}] No changes needed: {filename}")

if __name__ == "__main__":
    target_dir = r'C:\Users\silvestr.liskin\Desktop\risale-library\src\content\risale\tr'
    process_books(target_dir)
