import os

def replace_in_files(directory, target, replacement):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.next' in root:
            continue
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css', '.js', '.mjs')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    if target in content:
                        new_content = content.replace(target, replacement)
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated: {path}")
                except Exception as e:
                    print(f"Error in {path}: {e}")

if __name__ == "__main__":
    base_dir = r'c:\Users\bingi\crisis-sync'
    replace_in_files(base_dir, 'material-icons-round', 'material-icons-sharp')
    replace_in_files(base_dir, 'Material Icons Round', 'Material Icons Sharp')
