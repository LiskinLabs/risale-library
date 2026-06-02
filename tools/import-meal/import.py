import os
import json
import glob
import argparse

def main():
    parser = argparse.ArgumentParser(description="Import meal translations into JSON")
    parser.add_argument("--source", required=True, help="Path to risale_extraction/meal/tr/")
    parser.add_argument("--output", required=True, help="Path to output directory (e.g., apps/readest-app/src/services/hasiye/meal-data/)")
    args = parser.parse_args()

    if not os.path.exists(args.source):
        print(f"Error: Source directory {args.source} does not exist.")
        return

    os.makedirs(args.output, exist_ok=True)
    
    files = glob.glob(os.path.join(args.source, "*.json"))
    print(f"Found {len(files)} meal files.")
    
    all_meals = []
    
    for fpath in files:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    all_meals.extend(data)
                elif isinstance(data, dict):
                    all_meals.append(data)
        except Exception as e:
            print(f"Error parsing {fpath}: {e}")

    # Split into chunks of 5000 to avoid huge single json files
    chunk_size = 5000
    chunks = [all_meals[i:i + chunk_size] for i in range(0, len(all_meals), chunk_size)]
    
    for idx, chunk in enumerate(chunks):
        out_file = os.path.join(args.output, f"meal-{idx}.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(chunk, f, ensure_ascii=False, indent=2)
        print(f"Written {len(chunk)} meals to {out_file}")

if __name__ == "__main__":
    main()
