import os

file_path = r"C:\Users\silvestr.liskin\Desktop\risale_extraction\markdown_output\ru_sozler.md"

def try_fix_encoding(path):
    with open(path, 'rb') as f:
        content = f.read()
    
    # Try common recovery: bytes -> latin1 -> utf8
    try:
        # If it was saved as UTF-8 but read as Latin-1 and then saved again, 
        # it might be broken. But usually it's just a display issue.
        # Let's try to decode as UTF-8 directly first.
        text = content.decode('utf-8')
        print("--- Direct UTF-8 Decode ---")
        print(text[:200])
    except Exception as e:
        print(f"UTF-8 failed: {e}")

    try:
        # Common "mojibake" fix: text.encode('latin1').decode('utf-8')
        # But we have the bytes. Let's try to interpret bytes as CP1254 (Turkish) 
        # because the source app is Turkish.
        text_tr = content.decode('cp1254')
        print("\n--- CP1254 (Turkish) Decode ---")
        print(text_tr[:200])
    except Exception as e:
        print(f"CP1254 failed: {e}")

    try:
        # If it's UTF-8 bytes that were treated as CP1252/Latin1
        text_fix = content.decode('utf-8').encode('latin1').decode('utf-8')
        print("\n--- Mojibake Fix (latin1 -> utf8) ---")
        print(text_fix[:200])
    except Exception as e:
        pass

try_fix_encoding(file_path)
