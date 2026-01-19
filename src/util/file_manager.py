import sys
import os
from pathlib import Path

def replace_file(file_path, new_content):
    path = Path(file_path)
    # Ensure directory exists
    path.parent.mkdir(parents=True, exist_ok=True)
    
    # Optional: Create a backup
    if path.exists():
        backup = path.with_suffix('.js.bak')
        path.replace(backup)
        
    path.write_text(new_content, encoding='utf-8')
    return f"Successfully replaced {file_path}"

if __name__ == "__main__":
    # This allows the agent to call: 
    # python util/file_manager.py "src/path/file.js" "full content here"
    if len(sys.argv) >= 3:
        target = sys.argv[1]
        content = sys.argv[2]
        print(replace_file(target, content))