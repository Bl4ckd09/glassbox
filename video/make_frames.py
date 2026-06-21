#!/usr/bin/env python3
"""Render 1080p dark-theme frames for the GlassBox 1-minute demo video."""
import os, json
from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(__file__), "frames")
os.makedirs(OUT, exist_ok=True)

# palette (matches the app)
BG = (8, 8, 11)
PANEL = (18, 18, 22)
PANEL2 = (24, 24, 30)
ZINC = (161, 161, 170)
ZINC_L = (228, 228, 231)
WHITE = (244, 244, 245)
EMER = (52, 211, 153)
SKY = (56, 189, 248)
VIOLET = (167, 139, 250)
ROSE = (251, 113, 133)
AMBER = (252, 211, 77)
MUTE = (113, 113, 122)

SF = "/System/Library/Fonts/Supplemental/"
def font(name, size):
    for p in (SF + name, "/System/Library/Fonts/" + name):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", size)

def black(s): return font("Arial Black.ttf", s)
def bold(s):  return font("Arial Bold.ttf", s)
def reg(s):   return font("Arial.ttf", s)
def mono(s):  return ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", s)

def new():
    img = Image.new("RGB", (W, H), BG)
    return img, ImageDraw.Draw(img)

def tsize(d, text, f):
    b = d.textbbox((0, 0), text, font=f); return b[2]-b[0], b[3]-b[1]

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if tsize(d, t, f)[0] <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def para(d, text, f, x, y, maxw, fill, lh=1.4, center=False):
    for ln in wrap(d, text, f, maxw):
        w, h = tsize(d, ln, f)
        xx = (W-w)//2 if center else x
        d.text((xx, y), ln, font=f, fill=fill); y += int(h*lh)+6
    return y

def rrect(d, box, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)

def check(d, x, y, s, color):
    # draws a tick mark in an s x s box at (x,y)
    w = max(3, s//6)
    d.line([(x+s*0.12, y+s*0.55), (x+s*0.42, y+s*0.85), (x+s*0.92, y+s*0.18)], fill=color, width=w, joint="curve")

def chip(d, x, y, text, f, fg, bgc):
    w, h = tsize(d, text, f); pad = 18
    rrect(d, [x, y, x+w+pad*2, y+h+pad], 16, fill=bgc)
    d.text((x+pad, y+pad//2-2), text, font=f, fill=fg); return x+w+pad*2+14

def logo(d, x, y, s=46):
    rrect(d, [x, y, x+s, y+s], 12, fill=EMER)
    f = black(int(s*0.6)); w,h = tsize(d,"G",f)
    d.text((x+(s-w)//2, y+(s-h)//2-4), "G", font=f, fill=BG)

def footer(d, txt="glassbox-beige.vercel.app   ·   github.com/Bl4ckd09/glassbox"):
    f = reg(24); w,_ = tsize(d, txt, f)
    d.text(((W-w)//2, H-58), txt, font=f, fill=MUTE)

frames = []
def save(img, name, narration):
    p = os.path.join(OUT, name); img.save(p, "PNG")
    frames.append({"image": p, "narration": narration})

# ---------- 1 · Title ----------
img, d = new()
logo(d, 760, 300, 64)
d.text((838, 312), "GlassBox", font=black(64), fill=WHITE)
para(d, "Pre-registration for trading calls.", black(72), 0, 430, 1500, WHITE, center=True)
para(d, "Audit, don't trust.", bold(44), 0, 540, 1500, EMER, center=True)
x = 0
chips = [("Sui", SKY), ("DeepBook", EMER), ("Walrus", VIOLET)]
total = 0; cf = bold(26)
ws = [tsize(d, t, cf)[0]+36+14 for t,_ in chips]
sx = (W - (sum(ws)-14))//2
for (t,c),wch in zip(chips, ws):
    chip(d, sx, 660, t, cf, BG, c); sx += wch
footer(d)
save(img, "f1.png",
     "GlassBox brings pre-registration to trading. Audit — don't trust.")

# ---------- 2 · Problem ----------
img, d = new()
d.text((160, 150), "THE PROBLEM", font=bold(28), fill=ROSE)
para(d, "Finfluencers delete their losing calls.", black(66), 160, 210, 1620, WHITE)
para(d, "They post fifty trades, quietly remove the thirty that lost, screenshot the "
        "twenty that won, and sell you a 100%-win-rate fantasy.", reg(38), 160, 380, 1500, ZINC_L)
para(d, "Retail traders can't tell real skill from survivorship bias — a problem the "
        "FCA and SEC have both flagged.", reg(38), 160, 540, 1500, ZINC)
footer(d)
save(img, "f2.png",
     "Trading influencers delete their losing calls and sell you a cherry-picked "
     "highlight reel. You can't tell real skill from survivorship bias.")

# ---------- 3 · Insight ----------
img, d = new()
d.text((160, 150), "THE INSIGHT", font=bold(28), fill=SKY)
para(d, "On-chain trackers show what a wallet did.", bold(52), 160, 220, 1620, ZINC)
para(d, "GlassBox proves what a strategist said they'd do —", black(56), 160, 330, 1640, WHITE)
para(d, "in advance, with the receipts.", black(56), 160, 410, 1640, EMER)
rrect(d, [160, 560, 1760, 700], 18, fill=PANEL)
para(d, "It's clinical-trial pre-registration, applied to trading.", bold(40), 200, 600, 1520, ZINC_L)
footer(d)
save(img, "f3.png",
     "On-chain trackers show what a wallet did. GlassBox proves what a strategist "
     "said they would do, in advance — like clinical-trial pre-registration, applied to trading.")

# ---------- 4 · How it works ----------
img, d = new()
d.text((160, 130), "HOW IT WORKS", font=bold(28), fill=EMER)
steps = [
    ("1", "Computed on live markets", "The call is built from live Sui DeepBook order books and trade history — a real on-chain CLOB.", SKY),
    ("2", "Pre-registered before the outcome", "The full call — side, reasoning, risk plan — is signed with a Sui key and written to Walrus the instant it's made.", EMER),
    ("3", "Verifiable by anyone", "Re-fetch the blob from a public Walrus aggregator and check the signature. No need to trust us.", VIOLET),
]
y = 230
for n, t, body, c in steps:
    rrect(d, [160, y, 1760, y+200], 18, fill=PANEL)
    d.ellipse([200, y+60, 270, y+130], fill=c)
    nf = black(40); w,h = tsize(d,n,nf); d.text((200+(70-w)//2, y+60+(70-h)//2-4), n, font=nf, fill=BG)
    d.text((310, y+44), t, font=bold(40), fill=WHITE)
    para(d, body, reg(30), 310, y+104, 1380, ZINC, lh=1.3)
    y += 224
footer(d)
save(img, "f4.png",
     "Every call is computed from live Sui DeepBook markets, signed with a Sui key, "
     "and committed to Walrus before the outcome is known. Anyone can verify it.")

# ---------- 5 · Live proof (real captured data) ----------
img, d = new()
d.text((160, 110), "A REAL CALL — VERIFIED LIVE", font=bold(28), fill=EMER)
# call header
rrect(d, [160, 170, 1760, 470], 18, fill=PANEL)
d.text((200, 200), "HOLD", font=black(44), fill=ZINC)
d.text((360, 206), "SUI / USDC", font=bold(36), fill=WHITE)
d.text((360, 256), "entry 0.71127   ·   conviction -0.09   ·   transparent weighted-vote engine", font=reg(26), fill=MUTE)
# badges
chip(d, 200, 320, "RSI 63.2", reg(24), ZINC_L, PANEL2)
chip(d, 360, 320, "stop 1.5%", reg(24), ROSE, PANEL2)
chip(d, 540, 320, "target 2.7%", reg(24), EMER, PANEL2)
chip(d, 740, 320, "size 0.88%", reg(24), ZINC_L, PANEL2)
chip(d, 200, 390, "signed", reg(24), VIOLET, PANEL2)
chip(d, 330, 390, "anchored on Walrus", reg(24), EMER, PANEL2)
# proof panel
rrect(d, [160, 500, 1760, 880], 18, fill=(6,6,8), outline=PANEL2, width=2)
d.text((200, 530), "IMMUTABLE PROOF (Walrus testnet)", font=bold(26), fill=MUTE)
d.text((200, 580), "blobId:  77VWcMAKjI…I_6qpyfo", font=mono(28), fill=ZINC_L)
d.text((200, 626), "pre-registered before outcome · Walrus epoch 435 · Sui obj 0xd300…130b", font=reg(24), fill=MUTE)
check(d, 200, 700, 30, EMER)
d.text((244, 700), "Fetched from public Walrus aggregator — content matches.", font=bold(30), fill=EMER)
check(d, 200, 748, 30, EMER)
d.text((244, 748), "Signature valid — authored by 0xcb37…f673.", font=bold(30), fill=EMER)
d.text((200, 800), "Anyone can do this without GlassBox.", font=reg(26), fill=MUTE)
footer(d)
save(img, "f5.png",
     "Here's a real call, pre-registered on Walrus. Fetch it from a public aggregator "
     "and the content matches; the signature is valid. Tamper-proof, and impossible to fake.")

# ---------- 6 · Leaderboard (real scores) ----------
img, d = new()
d.text((160, 110), "VERIFIABLE LEADERBOARD", font=bold(28), fill=SKY)
para(d, "Ranked by a disclosed, risk-adjusted GlassBox Score — not raw PnL.", reg(32), 160, 158, 1600, ZINC)
rows = [
    ("1", "Diamond Hands Dan", "", "78.7", "+3.80%", "83%", EMER),
    ("2", "Momentum Mia", "", "65.1", "+1.12%", "57%", EMER),
    ("3", "Aletheia", "AI", "49.6", "-0.58%", "33%", ROSE),
]
y = 250
for n, name, tag, score, ret, win, rc in rows:
    rrect(d, [160, y, 1760, y+180], 18, fill=PANEL)
    d.text((205, y+66), n, font=black(40), fill=MUTE)
    d.ellipse([270, y+50, 350, y+130], fill=SKY)
    ini = "".join(w[0] for w in name.split())[:2]
    f=black(34); w,h=tsize(d,ini,f); d.text((270+(80-w)//2, y+50+(80-h)//2-4), ini, font=f, fill=BG)
    d.text((380, y+50), name, font=bold(38), fill=WHITE)
    if tag:
        chip(d, 380+tsize(d,name,bold(38))[0]+24, y+54, tag, bold(22), SKY, (20,40,60))
    check(d, 380, y+106, 22, EMER)
    d.text((412, y+104), "100% on Walrus", font=reg(24), fill=EMER)
    # stats right-aligned columns
    cols = [("GLASSBOX SCORE", score, SKY, black(44)),
            ("CUM. RETURN", ret, rc, bold(34)),
            ("WIN RATE", win, ZINC_L, bold(34))]
    cx = 1180
    for label, val, vc, vf in cols:
        d.text((cx, y+56), label, font=reg(20), fill=MUTE)
        d.text((cx, y+86), val, font=vf, fill=vc)
        cx += 210
    y += 204
para(d, "Even our own AI agent is shown underperforming. Nothing is hidden.",
     bold(30), 160, y+6, 1600, ZINC_L)
footer(d)
save(img, "f6.png",
     "Providers are ranked by a disclosed, risk-adjusted score — not raw profit. "
     "Even our own AI agent is shown underperforming. Nothing is hidden.")

# ---------- 7 · Close ----------
img, d = new()
logo(d, 820, 300, 80)
d.text((0, 410), "", font=reg(10), fill=BG)
para(d, "GlassBox", black(80), 0, 410, 1920, WHITE, center=True)
para(d, "Trading you can audit — not just trust.", bold(40), 0, 520, 1920, EMER, center=True)
cf = bold(28)
chips = [("Sui", SKY), ("DeepBook", EMER), ("Walrus", VIOLET), ("Vercel", ZINC_L)]
ws = [tsize(d, t, cf)[0]+36+14 for t,_ in chips]
sx = (W - (sum(ws)-14))//2
for (t,c),wch in zip(chips, ws):
    chip(d, sx, 620, t, cf, BG, c); sx += wch
para(d, "glassbox-beige.vercel.app", bold(34), 0, 730, 1920, SKY, center=True)
para(d, "github.com/Bl4ckd09/glassbox", reg(28), 0, 790, 1920, MUTE, center=True)
para(d, "Encode Vibe Coding Hackathon · Sui + BGA", reg(24), 0, 850, 1920, MUTE, center=True)
save(img, "f7.png",
     "GlassBox. Trading you can audit. Live now — built on Sui, for the Encode hackathon.")

with open(os.path.join(os.path.dirname(__file__), "manifest.json"), "w") as f:
    json.dump(frames, f, indent=2)
print(f"wrote {len(frames)} frames to {OUT}")
