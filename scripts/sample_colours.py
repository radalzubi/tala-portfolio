#!/usr/bin/env python3
"""Sample dominant warm/red tones from source images to tune design tokens (private helper)."""
import sys
from collections import Counter
from PIL import Image

def dominant(path, pred, n=6):
    im = Image.open(path).convert("RGB")
    im.thumbnail((400, 400))
    c = Counter()
    for px in im.getdata():
        r, g, b = px
        if pred(r, g, b):
            c[(r // 8 * 8, g // 8 * 8, b // 8 * 8)] += 1
    return [("#%02x%02x%02x" % k, v) for k, v in c.most_common(n)]

copper = lambda r, g, b: r > 120 and r > g + 30 and g > b + 10 and r - b > 60
red = lambda r, g, b: r > 120 and r > g + 60 and r > b + 60
for path in sys.argv[1:]:
    print(path.split("/")[-1])
    print("  copper:", dominant(path, copper))
    print("  red:", dominant(path, red))
