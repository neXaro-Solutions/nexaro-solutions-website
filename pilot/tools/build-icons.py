#!/usr/bin/env python3
"""Generate Pilot-only PWA, iOS and favicon assets from approved X-Jet artwork.

Called on GitHub Actions after icon.svg changes. No other brand/site assets touched.
Requires Pillow; source is the exact approved image embedded in pilot/icon.svg.
"""
from __future__ import annotations
import base64
from io import BytesIO
from pathlib import Path
import re
from PIL import Image

PILOT = Path(__file__).resolve().parents[1]
svg = (PILOT / "icon.svg").read_text(encoding="utf-8")
m = re.search(r'data:image/webp;base64,([A-Za-z0-9+/=]+)', svg)
if not m:
    raise SystemExit("Pilot icon source missing or invalid")
raw = base64.b64decode(m.group(1), validate=True)
if not raw.startswith(b"RIFF") or raw[8:12] != b"WEBP":
    raise SystemExit("Pilot icon is not a WebP source")
image = Image.open(BytesIO(raw)).convert("RGB")
if image.width != image.height or image.width < 160:
    raise SystemExit("Pilot icon must be square and at least 160 px wide")

def scale(side: int) -> Image.Image:
    return image.resize((side, side), Image.Resampling.LANCZOS)

for side in (16, 32, 48):
    scale(side).save(PILOT / f"favicon-{side}.png", optimize=True)
scale(180).save(PILOT / "apple-touch-icon.png", optimize=True)
scale(192).save(PILOT / "icon-192.png", optimize=True)
scale(512).save(PILOT / "icon-512.png", optimize=True)
# Android adaptive icons require the important content in the center safe area.
maskable = Image.new("RGB", (512, 512), "#fbfdf9")
inset = 58
maskable.paste(scale(512 - inset * 2), (inset, inset))
maskable.save(PILOT / "icon-maskable-512.png", optimize=True)
scale(48).save(PILOT / "favicon.ico",
               format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
print("Pilot X-Jet icons: favicon 16/32/48/ICO, Apple 180, PWA 192/512, maskable 512")
