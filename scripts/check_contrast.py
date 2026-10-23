#!/usr/bin/env python3
"""WCAG 2.x contrast check for the design tokens. Run: python3 -I scripts/check_contrast.py"""
import itertools, sys

TOKENS = {
    "chalk": "#F3F0E9", "sheet": "#FBFAF7", "ink": "#191A18", "ink-2": "#5B574F",
    "rule": "#9A948B", "copper": "#A95336", "copper-deep": "#8A3F27", "pencil": "#B8322A", "night": "#2A2825",
}
BACKGROUNDS = ["chalk", "sheet", "ink", "night"]
TEXT = ["ink", "ink-2", "rule", "copper", "copper-deep", "pencil", "chalk", "sheet"]

def lum(hexstr):
    r, g, b = (int(hexstr[i:i+2], 16) / 255 for i in (1, 3, 5))
    def ch(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def ratio(a, b):
    la, lb = lum(TOKENS[a]), lum(TOKENS[b])
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

bad = 0
for bg in BACKGROUNDS:
    for fg in TEXT:
        if fg == bg: continue
        r = ratio(fg, bg)
        grade = "AAA" if r >= 7 else "AA" if r >= 4.5 else "AA-large" if r >= 3 else "FAIL"
        print(f"{fg:12s} on {bg:6s} {r:5.2f}  {grade}")
