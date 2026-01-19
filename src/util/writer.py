import sys
from pathlib import Path

def write_file(target_path, content):
    p = Path(target_path)
    # Erstellt Ordner, falls sie nicht existieren
    p.parent.mkdir(parents=True, exist_ok=True)
    # Schreibt den Inhalt
    p.write_text(content, encoding='utf-8')
    return f"Successfully wrote {len(content)} bytes to {target_path}"

if __name__ == "__main__":
    # Aufruf: python util/writer.py "pfad" "inhalt"
    if len(sys.argv) >= 3:
        print(write_file(sys.argv[1], sys.argv[2]))