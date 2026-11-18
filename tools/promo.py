# Builds promo videos (EN/HE) from store/video/raw.mp4: intro card, captioned clips, outro card.
import asyncio, os, subprocess, base64
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.async_api import async_playwright
R = os.path.abspath('.')
F = R + '/node_modules/@fontsource/rubik/files/'
ICON = 'data:image/png;base64,' + base64.b64encode(open(R + '/store/play-icon-512.png', 'rb').read()).decode()
import json
CLIPS = [  # segment, offset start, offset end, en, he
    ('home', 0.5, 5.0, 'Feed everyone!', 'מאכילים את כולם!'),
    ('kitchen', 1.7, 6.7, 'Cook in the kitchen', 'מבשלים במטבח'),
    ('bath', 0.15, 4.55, 'Bubble baths', 'אמבטיית קצף'),
    ('bed', 0.6, 5.3, 'Time for bed', 'הולכים לישון'),
    ('park', 1.3, 6.5, 'Play in the park', 'משחקים בפארק'),
    ('vet', 0.5, 5.7, 'Care for cute pets', 'מטפלים בחיות מתוקות'),
    ('studio', 0.06, 4.46, 'Design your characters', 'מעצבים דמויות'),
]
TXT = {
    'en': ('Zuzu Town', 'Your pretend-play world', 'No ads · Made for kids · 48 hidden surprises'),
    'he': ('זוזו טאון', 'עולם של משחק דמיון', 'בלי פרסומות · מותאם לילדים · 48 הפתעות נסתרות'),
}
CSS = f"""@font-face{{font-family:R;src:url(file://{F}rubik-latin-800-normal.woff2)}}
@font-face{{font-family:R;src:url(file://{F}rubik-hebrew-800-normal.woff2);unicode-range:U+0590-05FF}}
html,body{{margin:0;width:1920px;height:1080px;font-family:R;color:#45365a}}"""
def card(title, sub, lang):
    d = 'rtl' if lang == 'he' else 'ltr'
    return f"""<html dir="{d}"><style>{CSS} body{{background:radial-gradient(circle at 50% 40%,#fff3f8,#ffc9de);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px}}
    img{{width:330px;height:330px;border-radius:74px;box-shadow:0 18px 0 rgba(69,54,90,.18)}} h1{{font-size:140px;margin:0}} p{{font-size:58px;margin:0;background:#fff;border:7px solid #45365a;border-radius:999px;padding:14px 54px}}</style>
    <body><img src="{ICON}"><h1>{title}</h1><p>{sub}</p></body></html>"""
def cap(text, lang):
    d = 'rtl' if lang == 'he' else 'ltr'
    return f"""<html dir="{d}"><style>{CSS} body{{background:transparent}} div{{position:absolute;bottom:56px;left:50%;transform:translateX(-50%);white-space:nowrap;
    background:#fff;border:8px solid #45365a;border-radius:999px;padding:16px 64px;font-size:74px;box-shadow:0 10px 0 rgba(69,54,90,.25)}}</style><body><div>{text}</div></body></html>"""
async def render():
    os.makedirs('/tmp/promo', exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox', '--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 1920, 'height': 1080})
        async def shot(html, out, transparent=False):
            open('/tmp/promo/x.html', 'w').write(html)
            await pg.goto('file:///tmp/promo/x.html'); await pg.wait_for_timeout(300)
            await pg.screenshot(path=out, omit_background=transparent)
        for lang, (t, s, o) in TXT.items():
            await shot(card(t, s, lang), f'/tmp/promo/intro-{lang}.png')
            await shot(card(t, o, lang), f'/tmp/promo/outro-{lang}.png')
            for i, c in enumerate(CLIPS):
                await shot(cap(c[3] if lang == 'en' else c[4], lang), f'/tmp/promo/cap-{lang}-{i}.png', True)
        await b.close()
asyncio.run(render())
def run(cmd): subprocess.run(cmd, check=True)
for lang in TXT:
    parts = []
    for name in ('intro', 'outro'):
        out = f'/tmp/promo/{name}-{lang}.mp4'
        dur = '2.2' if name == 'intro' else '3.2'
        run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-t', dur, '-i', f'/tmp/promo/{name}-{lang}.png', '-f', 'lavfi', '-t', dur, '-i', 'anullsrc=r=48000:cl=stereo',
             '-vf', 'fps=30,format=yuv420p,fade=t=in:st=0:d=0.3', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-c:a', 'aac', '-shortest', out])
    M = json.load(open(f'store/video/marks-{lang}.json'))
    for i, (seg, a, z, *_ ) in enumerate(CLIPS):
        s, e = M[seg] + a, M[seg] + z
        out = f'/tmp/promo/clip-{lang}-{i}.mp4'
        run(['ffmpeg', '-v', 'error', '-y', '-ss', str(s), '-to', str(e), '-i', f'store/video/raw-{lang}.mp4', '-loop', '1', '-i', f'/tmp/promo/cap-{lang}-{i}.png', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
             '-filter_complex', '[1:v]format=rgba,fade=t=in:st=0:d=0.25:alpha=1[c];[0:v][c]overlay=0:0:shortest=1,fps=30,format=yuv420p[v]', '-map', '[v]', '-map', '2:a',
             '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-c:a', 'aac', '-shortest', out])
    lst = [f'/tmp/promo/intro-{lang}.mp4'] + [f'/tmp/promo/clip-{lang}-{i}.mp4' for i in range(len(CLIPS))] + [f'/tmp/promo/outro-{lang}.mp4']
    open('/tmp/promo/list.txt', 'w').write(''.join(f"file '{x}'\n" for x in lst))
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', '/tmp/promo/list.txt', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', f'store/video/zuzu-town-promo-{lang}.mp4'])
    print('ok', lang)
