#!/usr/bin/env python3
"""Compose project heroes from real assets — floating cards + drop shadow."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

CANVAS = (1920, 1080)
BG = (243, 244, 246, 255)
RADIUS = 16
SHADOW_BLUR = 32
SHADOW_OFFSET = (0, 22)
SHADOW_ALPHA = 70
OUT_DIR = Path(__file__).resolve().parents[1] / "public" / "heroes"
REFS = Path("/tmp/hero-refs")


def fit(img: Image.Image, max_w: int, max_h: int) -> Image.Image:
    img = img.convert("RGBA")
    copy = img.copy()
    copy.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    return copy


def round_corners(img: Image.Image, radius: int = RADIUS) -> Image.Image:
    w, h = img.size
    r = min(radius, w // 2, h // 2)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius=r, fill=255)
    out = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    out.paste(img, (0, 0))
    out.putalpha(mask)
    return out


def card(path: Path, max_w: int, max_h: int) -> Image.Image:
    img = fit(Image.open(path), max_w, max_h)
    # Screenshots sit on a white plate so transparent product shots stay readable.
    plate = Image.new("RGBA", img.size, (255, 255, 255, 255))
    plate.alpha_composite(img)
    return round_corners(plate)


def with_shadow(card_img: Image.Image) -> tuple[Image.Image, int]:
    w, h = card_img.size
    pad = SHADOW_BLUR * 3
    layer = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    shadow = Image.new("RGBA", card_img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (0, 0, w - 1, h - 1), radius=RADIUS, fill=(15, 23, 42, SHADOW_ALPHA)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))
    ox, oy = SHADOW_OFFSET
    layer.alpha_composite(shadow, (pad + ox, pad + oy))
    layer.alpha_composite(card_img, (pad, pad))
    return layer, pad


def paste(canvas: Image.Image, img: Image.Image, x: int, y: int) -> None:
    cw, ch = canvas.size
    iw, ih = img.size
    dx, dy = max(x, 0), max(y, 0)
    sx, sy = dx - x, dy - y
    tw, th = min(iw - sx, cw - dx), min(ih - sy, ch - dy)
    if tw <= 0 or th <= 0:
        return
    crop = img.crop((sx, sy, sx + tw, sy + th))
    canvas.alpha_composite(crop, (dx, dy))


def compose(name: str, placements: list[tuple[Path, int, int, int, int]]) -> None:
    canvas = Image.new("RGBA", CANVAS, BG)
    # Paint back-to-front so later cards sit on top.
    for path, x, y, max_w, max_h in placements:
        piece, pad = with_shadow(card(path, max_w, max_h))
        paste(canvas, piece, x - pad, y - pad)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    dest = OUT_DIR / f"{name}-hero.png"
    canvas.convert("RGB").save(dest, "PNG", optimize=True)
    print(f"wrote {dest}")


def main() -> None:
    compose(
        "provelis",
        [
            (REFS / "provelis/workflow.png", 70, 80, 560, 320),
            (REFS / "provelis/interview.png", 1280, 90, 560, 320),
            (REFS / "provelis/requirements.png", 1240, 640, 600, 340),
            (REFS / "provelis/home.png", 340, 220, 920, 540),
        ],
    )
    compose(
        "aquara",
        [
            (REFS / "aquara/banner.png", 380, 150, 980, 560),
            (REFS / "aquara/settings.png", 80, 120, 280, 720),
            (REFS / "aquara/onboarding.png", 1420, 160, 280, 720),
            (REFS / "aquara/dashboard.png", 1500, 40, 280, 220),
        ],
    )
    compose(
        "omni",
        [
            (REFS / "omni/logo.png", 520, 160, 880, 560),
            (REFS / "omni/art.png", 60, 260, 520, 420),
            (REFS / "omni/xcode.png", 1320, 220, 540, 420),
        ],
    )
    compose(
        "orble",
        [
            (REFS / "orble/beta.png", 60, 160, 560, 520),
            (REFS / "orble/nextgen.png", 680, 140, 560, 720),
            (REFS / "orble/airport.jpg", 1280, 220, 560, 500),
        ],
    )
    compose(
        "per",
        [
            (REFS / "per/render3.jpg", 60, 220, 560, 420),
            (REFS / "per/render2.jpg", 480, 140, 980, 620),
            (REFS / "per/poster.png", 1380, 80, 480, 280),
            (REFS / "per/livery.png", 1320, 640, 540, 280),
        ],
    )
    compose(
        "yprize",
        [
            (REFS / "yprize/s1.jpg", 70, 240, 580, 330),
            (REFS / "yprize/s2.jpg", 670, 200, 580, 330),
            (REFS / "yprize/s3.jpg", 1270, 260, 580, 330),
        ],
    )
    compose(
        "pawfond",
        [
            (REFS / "pawfond/16oz.png", 180, 80, 720, 720),
            (REFS / "pawfond/8oz.png", 860, 160, 620, 320),
            (REFS / "pawfond/art.png", 860, 560, 520, 260),
            (REFS / "pawfond/display.webp", 1400, 280, 420, 420),
        ],
    )
    compose(
        "rumrush",
        [
            (REFS / "rumrush/thumb.png", 280, 140, 1100, 680),
            (REFS / "rumrush/hero.png", 1280, 80, 560, 340),
            (REFS / "rumrush/gdd.png", 80, 560, 360, 360),
        ],
    )


if __name__ == "__main__":
    main()
