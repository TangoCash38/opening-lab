#!/usr/bin/env python3
"""Build a playable Newspaper board texture from Sean's vintage collage.

Crops listing chrome, then lightens / flattens contrast / warms toward
newsprint, with a light blur + grain so woodcuts and type stay visible
as clippings without fighting chess glyphs.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

# Warm newsprint the texture is pulled toward (same family as #f2e6c4).
PAPER = np.array([242.0, 230.0, 196.0], dtype=np.float32)

# Locked after previewing cream-wash boards at phone size (~390px).
CONTRAST = 0.68
BRIGHTNESS = 1.18
SATURATION = 0.74
PAPER_MIX = 0.16
DARK_LIFT = 18.0
BLUR = 0.55
GRAIN_SIGMA = 4.5
SEED = 38


def crop_collage(im: Image.Image) -> Image.Image:
    """Drop dark chrome; keep the dense clipping patch."""
    arr = np.asarray(im.convert("RGB"))
    row_mean = arr.mean(axis=(1, 2))
    bright = row_mean > 80
    idxs = np.where(bright)[0]
    if len(idxs) < 64:
        return im
    y0, y1 = int(idxs[0]), int(idxs[-1])
    y0 = min(y0 + 8, y1 - 64)
    y1 = max(y1 - 8, y0 + 64)
    w, _ = im.size
    return im.crop((0, y0, w, y1 + 1))


def square_from_upper_center(im: Image.Image) -> Image.Image:
    w, h = im.size
    side = min(w, h)
    x0 = (w - side) // 2
    # Bias up slightly — denser woodcuts sit in the upper/mid collage.
    y0 = max(0, (h - side) // 2 - side // 16)
    if y0 + side > h:
        y0 = h - side
    return im.crop((x0, y0, x0 + side, y0 + side))


def soften_to_newsprint(im: Image.Image) -> Image.Image:
    im = ImageEnhance.Contrast(im).enhance(CONTRAST)
    im = ImageEnhance.Brightness(im).enhance(BRIGHTNESS)
    im = ImageEnhance.Color(im).enhance(SATURATION)

    arr = np.asarray(im).astype(np.float32)
    paper = PAPER.reshape(1, 1, 3)
    lifted = arr * (1.0 - PAPER_MIX) + paper * PAPER_MIX
    luma = lifted.mean(axis=2, keepdims=True)
    extra = np.clip((140.0 - luma) / 140.0, 0.0, 1.0) * DARK_LIFT
    lifted = np.clip(lifted + extra, 0, 255)

    out = Image.fromarray(lifted.astype(np.uint8))
    out = out.filter(ImageFilter.GaussianBlur(radius=BLUR))

    rng = np.random.default_rng(SEED)
    grain = rng.normal(0.0, GRAIN_SIGMA, (out.size[1], out.size[0], 1)).astype(
        np.float32
    )
    grained = np.clip(np.asarray(out).astype(np.float32) + grain, 0, 255)
    return Image.fromarray(grained.astype(np.uint8))


def save_webp(im: Image.Image, dest: Path, quality: int) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, format="WEBP", quality=quality, method=6)
    kb = dest.stat().st_size / 1024
    print(f"wrote {dest}  {im.size[0]}x{im.size[1]}  {kb:.1f} KB  q={quality}")
    if dest.stat().st_size > 400 * 1024:
        print("WARNING: over 400KB — consider lowering quality or size")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    p = argparse.ArgumentParser()
    p.add_argument("--src", type=Path, default=root / "newspaper-ref-collage.png")
    p.add_argument(
        "--out",
        type=Path,
        default=root / "public/board-textures/newspaper-clippings.webp",
    )
    p.add_argument("--size", type=int, default=896)
    p.add_argument("--quality", type=int, default=74)
    args = p.parse_args()

    src = Image.open(args.src).convert("RGB")
    collage = crop_collage(src)
    square = square_from_upper_center(collage)
    square = square.resize((args.size, args.size), Image.Resampling.LANCZOS)
    texture = soften_to_newsprint(square)
    save_webp(texture, args.out, args.quality)


if __name__ == "__main__":
    main()
