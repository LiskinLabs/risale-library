import os
import json
import urllib.parse
import hashlib

SOURCE_MD = r"C:\Users\silvestr.liskin\Desktop\risale-library\apps\readest-app\public\books"
LIBRARY_STRUCT = r"C:\Users\silvestr.liskin\Desktop\risale_extraction\library_structure.json"
CATALOG_PATH = r"C:\Users\silvestr.liskin\Desktop\risale-library\apps\readest-app\public\catalog.json"

# Цвета для категорий, чтобы библиотека была живой
CATEGORY_COLORS = {
    "Sözler": "#d35400", # Оранжевый
    "Mektubat": "#2980b9", # Синий
    "Lem'alar": "#27ae60", # Зеленый
    "Şualar": "#8e44ad", # Фиолетовый
    "Asa-yı Musa": "#f1c40f", # Желтый
    "Kur'an-ı Kerim": "#16a085", # Темно-зеленый
    "Kütüb-i Sitte": "#c0392b" # Красный
}

def process():
    with open(LIBRARY_STRUCT, 'r', encoding='utf-8') as f:
        categories = json.load(f)

    catalog = []
    
    for cat in categories:
        if cat['id'] in [0, 1, 2]: continue
        
        main_cat = cat.get('main_category', 'Risale-i Nur')
        tr_title = cat.get('names', {}).get('tr', {}).get('title', 'Diğer')
        
        shelf_color = CATEGORY_COLORS.get(tr_title, "#34495e")

        for book in cat.get('books', []):
            lang = book.get('language', 'tr')
            file_name = book.get('file_name', '')
            pretty_name = book.get('name', file_name)
            
            # Проверяем физическое наличие файла
            target_path = os.path.join(SOURCE_MD, lang, file_name + ".md")
            # (Тут логика путей может быть сложной из-за моих прошлых итераций, 
            # упростим: ищем файл рекурсивно)
            
            found_url = None
            for root, dirs, files in os.walk(SOURCE_MD):
                if f"{file_name}.md" in files:
                    rel = os.path.relpath(os.path.join(root, f"{file_name}.md"), os.path.dirname(SOURCE_MD))
                    found_url = "/" + rel.replace('\\', '/')
                    break
            
            if not found_url: continue

            catalog.append({
                "id": hashlib.md5(found_url.encode()).hexdigest(),
                "title": pretty_name,
                "lang": lang,
                "category": main_cat,
                "shelf": tr_title,
                "url": found_url,
                "color": shelf_color
            })

    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"CATALOG GENERATED: {len(catalog)} books organized.")

if __name__ == "__main__":
    process()
