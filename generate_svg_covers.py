import os
import xml.etree.ElementTree as ET

books = [
    ("Asa-yı Musa", "#4A6572"),
    ("Asâr-ı Bediiye", "#344955"),
    ("Barla Lâhikası", "#232F34"),
    ("Emirdağ Lâhikası", "#5D4037"),
    ("İşârâtü'l-İ'caz", "#2E7D32"),
    ("Kastamonu Lâhikası", "#1565C0"),
    ("Lem'alar", "#00695C"),
    ("Mektubat", "#C62828"),
    ("Mesnevî-i Nuriye", "#6A1B9A"),
    ("Muhakemat", "#37474F"),
    ("Sikke-i Tasdik-i Gaybî", "#F9A825"),
    ("Sözler", "#1565C0"),
    ("Şualar", "#EF6C00"),
    ("Tarihçe-i Hayat", "#4527A0")
]

output_dir = r"C:\Users\silvestr.liskin\Desktop\risale-library\public\covers\tr"
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

svg_template = """
<svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="grad_{id}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:{color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:{color2};stop-opacity:1" />
        </linearGradient>
    </defs>
    <rect width="400" height="600" fill="url(#grad_{id})" />
    <path d="M0 0 L400 600 M400 0 L0 600" stroke="white" stroke-width="0.5" stroke-opacity="0.1" />
    <circle cx="200" cy="300" r="150" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.2" />
    <text x="50%" y="45%" text-anchor="middle" fill="white" font-family="Serif, Georgia" font-size="32" font-weight="bold">{title}</text>
    <text x="50%" y="55%" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Serif" font-size="18">Risale-i Nur</text>
    <rect x="20" y="20" width="360" height="560" fill="none" stroke="gold" stroke-width="2" stroke-opacity="0.3" />
</svg>
"""

for title, color in books:
    # Упрощаем имя файла
    filename = title.replace("'", "").replace("-", "_").replace(" ", "_").replace("İ", "I").replace("ı", "i") + ".svg"
    filepath = os.path.join(output_dir, filename)
    
    # Генерируем два оттенка для градиента
    color1 = color
    color2 = "#121212" # Темный низ для глубины
    
    content = svg_template.format(id=title.replace(" ", ""), title=title.upper(), color1=color1, color2=color2)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated: {filename}")
