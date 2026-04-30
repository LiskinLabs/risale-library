import os, shutil, json, re

SRC = r"C:\Users\silvestr.liskin\Desktop\risale_extraction\markdown_output"
DEST = r"C:\Users\silvestr.liskin\Desktop\risale-library\apps\readest-app\public\books"
STRUCT_FILE = r"C:\Users\silvestr.liskin\Desktop\risale_extraction\library_structure.json"

def process():
    if os.path.exists(DEST): shutil.rmtree(DEST)
    os.makedirs(DEST, exist_ok=True)
    
    with open(STRUCT_FILE, 'r', encoding='utf-8') as f:
        struct = json.load(f)

    catalog = []
    
    for shelf in struct:
        if shelf['id'] in [0, 1, 2]: continue
        
        main_cat = shelf.get('main_category', 'Risale-i Nur')
        shelf_title = shelf.get('names', {}).get('tr', {}).get('title', 'Diğer')

        for b in shelf.get('books', []):
            lang = b.get('language', 'tr')
            code = b.get('file_name', '')
            name = b.get('name', code)
            
            # Find file
            possible = [f"{lang}_{code}.md", f"{code}.md", f"{lang}_{code}Y.md", f"{code}Y.md"]
            found = None
            for p in possible:
                if os.path.exists(os.path.join(SRC, p)):
                    found = p
                    break
            
            if not found: continue

            # Copy and clean
            lang_dir = os.path.join(DEST, lang)
            os.makedirs(lang_dir, exist_ok=True)
            
            clean_name = re.sub(r'[<>:"/\\|?*]', '', name).strip()
            target_file = f"{clean_name}.md"
            
            with open(os.path.join(SRC, found), 'r', encoding='utf-8') as f_in:
                text = f_in.read()
            
            # Semantic cleaning (Headers centering)
            text = re.sub(r'^---.*?---\s*', '', text, flags=re.DOTALL)
            text = re.sub(r'&(.*?)[>]', r'# \1', text) # Simplified for now, styling via CSS
            text = text.replace('€', '').replace('><', ' ')
            
            with open(os.path.join(lang_dir, target_file), 'w', encoding='utf-8') as f_out:
                f_out.write(f"---\ntitle: \"{name}\"\ndir: \"{'rtl' if lang in ['ar','fa','ur'] else 'ltr'}\"\n---\n\n{text}")
            
            catalog.append({
                "title": name,
                "lang": lang,
                "main": main_cat,
                "shelf": shelf_title,
                "url": f"/books/{lang}/{target_file}"
            })

    with open(r"C:\Users\silvestr.liskin\Desktop\risale-library\apps\readest-app\public\catalog.json", 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"DONE! {len(catalog)} books ready.")

if __name__ == "__main__": process()
