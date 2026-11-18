# usage: python3 tools/shot.py URL OUT.png [width height] [wait_ms] [dpr] [script]
import sys, asyncio, os
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.async_api import async_playwright
async def main():
    url, out = sys.argv[1], sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
    h = int(sys.argv[4]) if len(sys.argv) > 4 else 900
    wait = int(sys.argv[5]) if len(sys.argv) > 5 else 1500
    dpr = float(sys.argv[6]) if len(sys.argv) > 6 else 1
    script = sys.argv[7] if len(sys.argv) > 7 else ''
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr, has_touch=False)
        pg = await ctx.new_page()
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto(url)
        try:
            await pg.wait_for_function('window.__done === true', timeout=30000)
        except Exception as e:
            logs.append('wait timeout')
        await pg.wait_for_timeout(wait)
        if script:
            exec(compile(open(script).read(), script, 'exec'), globals())
            await globals()['run'](pg)
        await pg.screenshot(path=out)
        await b.close()
        for l in logs[:30]:
            print(l)
asyncio.run(main())
