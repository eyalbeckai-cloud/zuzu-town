# Generates store screenshots (EN + HE captions) for App Store and Google Play.
import asyncio, os, sys
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
from playwright.async_api import async_playwright

BASE = 'http://localhost:5173/'
SIZES = {  # name: (css w, css h, dpr)
    'iphone69': (956, 440, 3),
    'ipad13': (1376, 1032, 2),
    'play': (960, 540, 2),
}
SCENES = [
    ('1-home', '?loc=home', """
      sc.camX = 0; const A = [...sc.actors.values()];
      const tv = A.find(a => a.e.def === 'tv'); sc.tap(tv); sc.tap(tv);
      const radio = A.find(a => a.e.def === 'radio'); sc.tap(radio);
      for (const a of A) if (a.look && a.e.s.rid === 'ben') a.setMood('happy', 99);
    """, 'Make up your own stories!', 'ממציאים סיפורים משלכם!'),
    ('2-kitchen', '?loc=home', """
      sc.camX = sc.camMax(); const A = [...sc.actors.values()];
      sc.tap(A.find(a => a.e.def === 'fridge')); sc.tap(A.find(a => a.e.def === 'stove'));
      const mom = A.find(a => a.look && a.e.s.rid === 'mom'); const dad = A.find(a => a.look && a.e.s.rid === 'dad');
      const ch = A.filter(a => a.e.def === 'chair'); if (dad && ch[0]) sc.attachTo(dad, ch[0], 0);
      if (mom) mom.setMood('happy', 99);
    """, 'Cook, bake and feed everyone', 'מבשלים, אופים ומאכילים את כולם'),
    ('3-bath', '?loc=bedroom', """
      sc.camX = sc.camMax(); const A = [...sc.actors.values()];
      const tub = A.find(a => a.e.def === 'bathtub'); const lia = A.find(a => a.look && a.e.s.rid === 'lia');
      if (tub && lia) sc.attachTo(lia, tub, 0);
      const dog = A.find(a => a.pet); const bed = A.find(a => a.e.def === 'bunkbed');
    """, 'Bubble baths and bedtime', 'אמבטיית קצף וזמן לישון'),
    ('4-bedroom', '?loc=bedroom', """
      sc.camX = 0; const A = [...sc.actors.values()];
      const sav = A.find(a => a.look && a.e.s.rid === 'savta'); const bed = A.find(a => a.e.def === 'bed');
      if (sav && bed) { sc.world.detach(sav.e); sc.attachTo(sav, bed, 0); }
      const ward = A.find(a => a.e.def === 'wardrobe'); sc.tap(ward);
      const lia = A.find(a => a.look && a.e.s.rid === 'lia'); const crown = [...sc.actors.values()].find(a => a.e.def === 'crown');
      if (lia && crown) { sc.world.detach(crown.e); sc.wear(lia, crown); }
    """, 'Dress up and play pretend', 'מתחפשים ומשחקים בדמיון'),
    ('5-park', '?loc=park', """
      sc.camX = 300; const A = [...sc.actors.values()];
      const cart = A.find(a => a.e.def === 'icecart');
      const om = A.find(a => a.look && a.e.s.rid === 'omer'); const sw = A.find(a => a.e.def === 'swingset');
      if (om && sw) sc.attachTo(om, sw, 1);
    """, 'Swings, slides and ice cream', 'נדנדות, מגלשה וגלידה'),
    ('6-bakery', '?loc=bakery&unlock=1', """
      sc.camX = 120; const A = [...sc.actors.values()];
      const ov = A.find(a => a.e.def === 'bakeoven'); sc.tap(ov);
      const dough = A.find(a => a.e.def === 'dough'); if (dough && ov) { sc.world.detach(dough.e); sc.attachTo(dough, ov, 0); }
      for (const a of A) if (a.look) a.setMood('happy', 99);
    """, 'Run your own bakery', 'מנהלים מאפייה משלכם'),
    ('7-vet', '?loc=vet&unlock=1', """
      sc.camX = Math.min(620, sc.camMax()); const A = [...sc.actors.values()];
      const xr = A.find(a => a.e.def === 'xray'); sc.tap(xr);
      const pb = A.find(a => a.e.def === 'petbath'); const bun = A.find(a => a.kind === 'bunny');
      if (pb && bun) { sc.world.detach(bun.e); sc.attachTo(bun, pb, 0); }
      const scl = A.find(a => a.e.def === 'petscale'); const ham = A.find(a => a.kind === 'hamster');
      if (scl && ham) { sc.world.detach(ham.e); sc.attachTo(ham, scl, 0); }
      const vet = A.find(a => a.look && a.e.s.rid === 'vet'); if (vet) vet.setMood('happy', 99);
    """, 'Care for cute pets', 'מטפלים בחיות מתוקות'),
    ('8-studio', '?scene=studio', """
      app.scene.cat = 'topColor'; app.scene.refreshPanel();
    """, 'Design every character', 'מעצבים כל דמות', 26),
    ('9-map', '?scene=map&unlock=1', "", 'A whole town to explore', 'עיר שלמה לגלות'),
]

CAP = """([t, left]) => { let d = document.getElementById('cap'); if (!d) { d = document.createElement('div'); d.id = 'cap'; document.body.appendChild(d); }
  d.dir = /[\\u0590-\\u05FF]/.test(t) ? 'rtl' : 'ltr';
  d.style.cssText = 'position:fixed;top:2.2vh;left:' + left + '%;transform:translateX(-50%);z-index:99;background:#fff;border:0.55vmin solid #45365a;border-radius:999px;padding:1.1vmin 4vmin;font:800 5.4vmin Rubik,sans-serif;color:#45365a;white-space:nowrap;box-shadow:0 0.8vmin 0 rgba(69,54,90,.25)';
  d.textContent = t; }"""

async def main():
    only = sys.argv[1:] 
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        for size, (w, h, dpr) in SIZES.items():
            for name, q, js, en, he, *rest in SCENES:
                left = rest[0] if rest else 50
                if only and name not in only: continue
                ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=dpr)
                pg = await ctx.new_page()
                await pg.goto(BASE + q + '&hidpi=1')
                await pg.wait_for_function('window.__done === true', timeout=30000)
                await pg.wait_for_timeout(1200)
                await pg.evaluate("""(code) => { const app = window.__app; const sc = app.scene; app.world.flags.dragged = true; (window.__disc || []).forEach((d, i) => { if (i % 8 < 5) app.world.flags['d:' + d.id] = true; }); if (sc.tutorial !== undefined) sc.tutorial = null; new Function('app','sc', code)(app, sc); }""", js)
                await pg.wait_for_timeout(1600)
                for lang, text in (('en', en), ('he', he)):
                    await pg.evaluate(CAP, [text, left])
                    await pg.wait_for_timeout(150)
                    out = f'store/screenshots/{size}-{lang}-{name}.png'
                    await pg.screenshot(path=out)
                await ctx.close()
                print('done', size, name)
        await b.close()
asyncio.run(main())
