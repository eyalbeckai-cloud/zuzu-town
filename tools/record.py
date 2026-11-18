# Records a gameplay promo (canvas only) with real mouse drags; outputs store/video/raw.webm
import asyncio, os, sys
LANG = sys.argv[1] if len(sys.argv) > 1 else 'en'
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.async_api import async_playwright
W, H = 960, 540
POS = """(sel) => { const app = window.__app, sc = app.scene, st = app.stage;
  const A = [...sc.actors.values()]; let a = null;
  if (sel.def) a = A.filter(x => x.e.def === sel.def)[sel.n || 0];
  if (sel.rid) a = A.find(x => x.look && x.e.s.rid === sel.rid);
  if (sel.pet) a = A.find(x => x.kind === sel.pet);
  if (!a) return null;
  const c = sel.head && a.headWorld ? a.headWorld() : a.center();
  const r = st.canvas.getBoundingClientRect();
  return { x: r.left + (c.x - sc.camX) * st.scale, y: r.top + (c.y - st.view.y) * st.scale }; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2, accept_downloads=True)
        pg = await ctx.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        async def pos(**sel):
            return await pg.evaluate(POS, sel)
        async def drag(a, b, steps=28, hold=180):
            await pg.mouse.move(a['x'], a['y']); await pg.mouse.down(); await pg.wait_for_timeout(hold)
            for i in range(1, steps + 1):
                t = i / steps; e = t * t * (3 - 2 * t)
                await pg.mouse.move(a['x'] + (b['x'] - a['x']) * e, a['y'] + (b['y'] - a['y']) * e - 60 * (1 - (2 * t - 1) ** 2))
                await pg.wait_for_timeout(16)
            await pg.wait_for_timeout(120); await pg.mouse.up()
        async def tap(q):
            await pg.mouse.click(q['x'], q['y'])
        async def goto(loc, cam):
            await pg.evaluate(f"window.__app.goto('{loc}')")
            await pg.wait_for_timeout(1700)
            await pg.evaluate(f"(() => {{ const sc = window.__app.scene; sc.camX = Math.max(sc.camMin(), Math.min({cam}, sc.camMax())); sc.tutorial = null; }})()")
            await pg.wait_for_timeout(500)
        await pg.goto('http://localhost:5173/?loc=home&unlock=1&hidpi=1')
        await pg.wait_for_function('window.__done === true', timeout=30000)
        await pg.evaluate("(lang) => { const app = window.__app; const w = app.world; w.flags = { dragged: true }; w.settings.lang = lang; app.overlay.applyLang(); app.scene.tutorial = null; }", LANG)
        await pg.evaluate("(() => { const sc = window.__app.scene; sc.camX = 0; })()")
        await pg.wait_for_timeout(600)
        await pg.evaluate("""() => { const c = document.getElementById('game'); const s = c.captureStream(30);
          window.__rec = new MediaRecorder(s, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 16000000 });
          window.__chunks = []; window.__rec.ondataavailable = (e) => window.__chunks.push(e.data); window.__rec.start(250); window.__t0 = performance.now(); }""")
        marks = []
        async def mark(name):
            marks.append((name, await pg.evaluate("(performance.now() - window.__t0) / 1000")))
        # 1 home: feed cupcake to noa, radio dance
        await mark('home')
        await pg.wait_for_timeout(700)
        await drag(await pos(def_='x') if False else await pos(**{'def': 'cupcake'}), await pos(rid='noa', head=True))
        await pg.wait_for_timeout(1500)
        await tap(await pos(**{'def': 'radio'}))
        await pg.wait_for_timeout(2600)
        await tap(await pos(**{'def': 'radio'}))
        # 2 kitchen
        await goto('home', 2000)
        await mark('kitchen')
        st = await pos(**{'def': 'stove'})
        await tap(st)
        await pg.wait_for_timeout(500)
        await tap(await pos(**{'def': 'fridge'}))
        await pg.wait_for_timeout(700)
        egg = await pos(**{'def': 'egg'})
        if egg: await drag(egg, {'x': st['x'] - 20, 'y': st['y'] - 70})
        await pg.wait_for_timeout(4200)
        # 3 bath
        await goto('bedroom', 2000)
        await mark('bath')
        tub = await pos(**{'def': 'bathtub'})
        await drag(await pos(rid='lia'), {'x': tub['x'], 'y': tub['y'] - 40})
        await pg.wait_for_timeout(1200)
        await tap(await pos(**{'def': 'toybox'})) if await pos(**{'def': 'toybox'}) else None
        await pg.wait_for_timeout(2200)
        # 4 bedtime
        await goto('bedroom', 0)
        await mark('bed')
        bed = await pos(**{'def': 'bed'})
        sav = await pos(rid='savta')
        if sav and bed: await drag(sav, {'x': bed['x'] - 40, 'y': bed['y'] - 60})
        await pg.wait_for_timeout(1300)
        await tap(await pos(**{'def': 'wardrobe'}))
        await pg.wait_for_timeout(2400)
        # 5 park
        await goto('park', 250)
        await mark('park')
        sw = await pos(**{'def': 'swingset'})
        om = await pos(rid='omer')
        if om and sw: await drag(om, {'x': sw['x'] + 50, 'y': sw['y'] - 90})
        await pg.wait_for_timeout(900)
        await tap(await pos(**{'def': 'swingset'}))
        await pg.wait_for_timeout(1300)
        ic = await pos(**{'def': 'icecart'})
        if ic: await tap(ic)
        await pg.wait_for_timeout(2600)
        # 6 bakery
        await goto('bakery', 150)
        await mark('bakery')
        ov = await pos(**{'def': 'bakeoven'})
        await tap(ov)
        await tap(await pos(**{'def': 'worktable'}))
        await pg.wait_for_timeout(1400)
        dough = await pos(**{'def': 'dough'}) or await pos(**{'def': 'batter'})
        if dough: await drag(dough, {'x': ov['x'], 'y': ov['y'] - 40})
        await pg.wait_for_timeout(4300)
        # 7 vet
        await goto('vet', 450)
        await mark('vet')
        scl = await pos(**{'def': 'petscale'})
        ham = await pos(pet='hamster')
        if ham and scl: await drag(ham, {'x': scl['x'], 'y': scl['y'] - 30})
        await pg.wait_for_timeout(900)
        await tap(await pos(**{'def': 'xray'}))
        await pg.wait_for_timeout(3000)
        # 8 studio
        await pg.evaluate("window.__app.openStudio()")
        await pg.wait_for_timeout(1700)
        await mark('studio')
        for cat, vals in (('hair', [4, 3]), ('topColor', [7, 2]), ('acc', [2])):
            for v in vals:
                await pg.evaluate(f"(async () => {{ const s = window.__app.scene; s.cat = '{cat}'; s.refreshPanel(); await s.change('{cat}', {v}); }})()")
                await pg.wait_for_timeout(750)
        await pg.wait_for_timeout(600)
        await mark('end')
        async with pg.expect_download() as dl:
            await pg.evaluate("""() => new Promise(res => { window.__rec.onstop = () => { const b = new Blob(window.__chunks, { type: 'video/webm' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'raw.webm'; document.body.appendChild(a); a.click(); res(); }; window.__rec.stop(); })""")
        d = await dl.value
        await d.save_as(f'store/video/raw-{LANG}.webm')
        import json; json.dump(dict(marks), open(f'store/video/marks-{LANG}.json', 'w'))
        print('marks', [(n, round(t, 2)) for n, t in marks])
        print('errs', errs[:5])
        await b.close()
asyncio.run(main())
