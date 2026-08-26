import os
import json
import glob

REPORTS_DIR = os.path.join(os.getcwd(), 'Reports')
files = glob.glob(os.path.join(REPORTS_DIR, '*.json'))
count = 0
deleted = 0

print(f"Checking {len(files)} JSON files in {REPORTS_DIR}...")

for f in files:
    try:
        with open(f, 'r', encoding='utf-16') as file:
            content = file.read()
            if not content.strip():
                print(f"Empty file: {f}")
                os.remove(f)
                deleted += 1
                continue
            json.loads(content)
            count += 1
    except (json.JSONDecodeError, UnicodeError):
        # The file is corrupted (likely truncated or bad encoding)
        print(f"Corrupted file found and deleted: {f}")
        try:
            os.remove(f)
            deleted += 1
        except Exception as e:
            print(f"Error deleting {f}: {e}")
    except Exception as e:
        print(f"Error checking {f}: {e}")

print(f"Finished. Valid: {count}, Deleted: {deleted}")
