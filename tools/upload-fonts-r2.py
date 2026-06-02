#!/usr/bin/env python3
"""Upload built-in fonts to Cloudflare R2 for web access.

Requires R2 credentials in .env.local:
  R2_ACCOUNT_ID=...
  R2_ACCESS_KEY_ID=...
  R2_SECRET_ACCESS_KEY=...
  R2_BUCKET_NAME=...
"""

import boto3
import os
import sys
from pathlib import Path

# Load env from project .env.local
PROJECT_ROOT = Path(__file__).parent.parent
ENV_FILE = PROJECT_ROOT / "apps" / "readest-app" / ".env.local"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            if k not in os.environ:
                os.environ[k] = v.strip().strip('"').strip("'")

R2_ACCESS_KEY = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_BUCKET = os.getenv("R2_BUCKET_NAME", "risale-ai-studio")

if not R2_ACCESS_KEY or not R2_SECRET_KEY or not R2_ACCOUNT_ID:
    print("ERROR: Set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID in .env.local",
          file=sys.stderr)
    sys.exit(1)

FONTS_DIR = PROJECT_ROOT / "apps" / "readest-app" / "public" / "fonts"
R2_ENDPOINT = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

def main():
    s3 = boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
    )

    total = 0
    uploaded = 0
    font_exts = {'.ttf', '.otf', '.woff', '.woff2'}

    for font_file in FONTS_DIR.rglob('*'):
        if font_file.suffix.lower() in font_exts:
            key = f"fonts/{font_file.relative_to(FONTS_DIR).as_posix()}"
            total += 1
            try:
                s3.upload_file(
                    str(font_file), R2_BUCKET, key,
                    ExtraArgs={'ContentType': f'font/{font_file.suffix[1:]}'}
                )
                uploaded += 1
                if uploaded % 10 == 0:
                    print(f"  Uploaded {uploaded}/{total}...")
            except Exception as e:
                print(f"  ❌ {key}: {e}")

    print(f"\n✅ {uploaded}/{total} fonts uploaded to R2 bucket '{R2_BUCKET}'")
    print(f"   CDN URL: https://storage.risale-ai-studio.com/fonts/")

if __name__ == "__main__":
    main()
