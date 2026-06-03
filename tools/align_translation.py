import os
import re
import sys
import json

def parse_blocks(text):
    """
    Splits text into blocks based on page markers (#number) and headers (∑, &).
    Returns a list of dictionaries: {'anchor': '...', 'lines': [...] }
    """
    blocks = []
    current_anchor = "START"
    current_lines = []
    
    for line in text.split('\n'):
        line = line.strip()
        if not line:
            continue
            
        # Detect anchors
        is_anchor = False
        if line.startswith('#'):
            is_anchor = True
            anchor_val = line
        elif line.startswith('&') or line.startswith('∑'):
            is_anchor = True
            anchor_val = line
            
        if is_anchor:
            if current_lines or current_anchor != "START":
                blocks.append({'anchor': current_anchor, 'lines': current_lines})
            current_anchor = anchor_val
            current_lines = []
        else:
            current_lines.append(line)
            
    if current_lines or current_anchor != "START":
        blocks.append({'anchor': current_anchor, 'lines': current_lines})
        
    return blocks

def align_books(tr_path, ru_path, out_dir):
    print(f"Aligning {tr_path} and {ru_path}...")
    
    with open(tr_path, 'r', encoding='utf-8') as f:
        tr_text = f.read()
    with open(ru_path, 'r', encoding='utf-8') as f:
        ru_text = f.read()
        
    tr_blocks = parse_blocks(tr_text)
    ru_blocks = parse_blocks(ru_text)
    
    os.makedirs(out_dir, exist_ok=True)
    review_log_path = os.path.join(out_dir, '_review_needed.log')
    aligned_path = os.path.join(out_dir, '_aligned_draft.txt')
    
    with open(review_log_path, 'w', encoding='utf-8') as flog, open(aligned_path, 'w', encoding='utf-8') as fout:
        # We assume blocks roughly align by sequence, but we check anchors.
        # This is a naive parallel iteration. A real diff algorithm is better, 
        # but since Risale texts are strictly translated page-by-page, this often works.
        
        tr_idx = 0
        ru_idx = 0
        
        chapter_counter = 1
        
        while tr_idx < len(tr_blocks) and ru_idx < len(ru_blocks):
            tb = tr_blocks[tr_idx]
            rb = ru_blocks[ru_idx]
            
            # Write anchor
            fout.write(f"\n{tb['anchor']}\n")
            
            # Check paragraph counts
            if len(tb['lines']) != len(rb['lines']):
                warning = f"MISMATCH at Anchor TR: {tb['anchor']} | RU: {rb['anchor']}\n"
                warning += f"  TR lines: {len(tb['lines'])}\n"
                warning += f"  RU lines: {len(rb['lines'])}\n"
                warning += "-"*40 + "\n"
                flog.write(warning)
                
                # Write to draft with a big warning so manual reviewer sees it
                fout.write(f"\n[⚠️ MANUAL REVIEW NEEDED: TR={len(tb['lines'])} vs RU={len(rb['lines'])}]\n")
                fout.write("--- TR ---\n")
                fout.write("\n".join(tb['lines']) + "\n")
                fout.write("--- RU ---\n")
                fout.write("\n".join(rb['lines']) + "\n")
                fout.write("[/⚠️]\n\n")
            else:
                # Aligned perfectly
                # In parallel view, we usually just need them to have the same paragraph breaks.
                # Here we just output the RU version as the draft, because TR is already in the app.
                # Actually, the task is to produce the RU EPUB.
                fout.write("\n".join(rb['lines']) + "\n")
                
            tr_idx += 1
            ru_idx += 1
            
    print(f"Alignment complete. Check {review_log_path} for manual review tasks.")

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python align_translation.py <tr_txt> <ru_txt> <out_dir>")
        sys.exit(1)
    align_books(sys.argv[1], sys.argv[2], sys.argv[3])
