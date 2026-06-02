#!/usr/bin/env python3
"""Upload built-in fonts to Cloudflare R2 for web access."""

import boto3
from pathlib import Path

FONTS_DIR = Path("C:/Users/silvestr.liskin/Desktop/risale-ai-studio/apps/readest-app/public/fonts")

# R2 credentials (matching Cloudflare R2 S3-compatible API)
R2_ACCESS_KEY = "8b085bf2dabf4afdcfb365539ca539ab"
R2_SECRET_KEY = "724e00001eb1c7dd6293c776c468d621422765464e09b5b7c34989ee42127277"
R2_ACCOUNT_ID = "ac7696f5a479d3d82ab1d3b998e67255"
R2_BUCKET = "risale-ai-studio"
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
