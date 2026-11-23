# Renders the V2 wallpapers with the dither from the V2 Figma (node 75:1992).
# Usage: python3 scripts/dither-wallpapers.py <source.png> <opacity> <out-prefix>
# Writes <out>.webp (3840 wide, 4px pixels), <out>-1920.webp (2px pixels) and
# <out>-thumb.webp. Put the results in public/V2/os/v2/.
import sys, numpy as np
from PIL import Image
# Exact port of the Figma "Dither" effect used on the V2 wallpaper:
# Bayer 16x16 ordered, mono (white), levels 5, contrast 1.54, brightness 100, pixel size 2.
def bayer(N):
    if N == 1: return np.array([[0]])
    s = bayer(N // 2); m = N // 2
    out = np.zeros((N, N))
    for y in range(N):
        for x in range(N):
            v = s[y % m][x % m] * 4
            qx, qy = x // m, y // m
            qoff = 0 if (qy == 0 and qx == 0) else 2 if (qy == 0 and qx == 1) else 3 if (qy == 1 and qx == 0) else 1
            out[y][x] = v + qoff
    return out
T = (bayer(16) + 0.5) / 256.0
def dither(img, opacity, width, pixel):
    h = round(width * img.height / img.width)
    W, H = int(np.ceil(width / pixel)), int(np.ceil(h / pixel))
    # Sample at block centres (bilinear), as the load pass does.
    rgb = np.asarray(img.convert('RGB').resize((W, H), Image.BILINEAR), dtype=np.float64) / 255.0 * opacity
    c = np.clip((rgb - 0.5) * 1.54 + 0.5 + 0.0, 0, 1)
    l = c @ np.array([0.2126, 0.7152, 0.0722])
    th = T[np.arange(H)[:, None] % 16, np.arange(W)[None, :] % 16]
    L = 4.0
    q = np.clip(np.round((l + (th - 0.5) / L) * L) / L, 0, 1)
    small = Image.fromarray((q * 255).round().astype(np.uint8), 'L')
    return small.resize((W * pixel, H * pixel), Image.NEAREST).crop((0, 0, width, h))
src, op, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
img = Image.open(src)
for width, pixel, suf in ((3840, 4, ''), (1920, 2, '-1920')):
    d = dither(img, op, width, pixel)
    d.save(f'{out}{suf}.webp', lossless=True, method=6)
d = dither(img, op, 1920, 2).resize((480, 270), Image.LANCZOS)
d.save(f'{out}-thumb.webp', quality=85)
