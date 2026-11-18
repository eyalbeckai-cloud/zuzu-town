import json
JS_INFO = """() => { const a = window.__app; const sc = a.scene; const st = a.stage;
 const out = []; for (const ac of sc.actors.values()) { const c = ac.center ? ac.center() : {x: ac.x, y: ac.y};
   out.push({id: ac.e.id, def: ac.e.def, rid: ac.e.s && ac.e.s.rid, x: ac.x, y: ac.y, cx: c.x, cy: c.y, p: ac.e.p || null,
     hx: ac.headWorld ? ac.headWorld().x : null, hy: ac.headWorld ? ac.headWorld().y : null}); }
 return {cam: sc.camX, vy: st.view.y, s: st.scale, actors: out}; }"""

async def info(pg):
    return await pg.evaluate(JS_INFO)

def scr(inf, x, y):
    return ((x - inf['cam']) * inf['s'], (y - inf['vy']) * inf['s'])

async def drag(pg, a, b, steps=12):
    await pg.mouse.move(*a)
    await pg.mouse.down()
    for i in range(1, steps + 1):
        await pg.mouse.move(a[0] + (b[0] - a[0]) * i / steps, a[1] + (b[1] - a[1]) * i / steps)
        await pg.wait_for_timeout(16)
    await pg.mouse.up()

async def tap(pg, p):
    await pg.mouse.move(*p)
    await pg.mouse.down()
    await pg.wait_for_timeout(40)
    await pg.mouse.up()

def find(inf, **kw):
    for a in inf['actors']:
        if all(a.get(k) == v for k, v in kw.items()):
            return a
    return None

async def run(pg):
    inf = await info(pg)
    cup = [a for a in inf['actors'] if a['def'] == 'cupcake'][0]
    ben = find(inf, rid='ben')
    await drag(pg, scr(inf, cup['cx'], cup['cy']), scr(inf, ben['hx'], ben['hy']))
    await pg.wait_for_timeout(400)
    await pg.screenshot(path='tools/out/i1_feed.png')
    inf = await info(pg)
    noa = find(inf, rid='noa')
    sofa = [a for a in inf['actors'] if a['def'] == 'sofa'][0]
    await drag(pg, scr(inf, noa['hx'], noa['hy']), scr(inf, sofa['x'] - 0, sofa['y'] - 150))
    await pg.wait_for_timeout(500)
    inf = await info(pg)
    tv = [a for a in inf['actors'] if a['def'] == 'tv'][0]
    await tap(pg, scr(inf, tv['cx'], tv['cy']))
    await pg.wait_for_timeout(300)
    sw = [a for a in inf['actors'] if a['def'] == 'lightswitch'][0]
    await tap(pg, scr(inf, sw['cx'], sw['cy']))
    await pg.wait_for_timeout(300)
    lamp = [a for a in inf['actors'] if a['def'] == 'floorlamp'][0]
    await tap(pg, scr(inf, lamp['x'], lamp['y'] - 280))
    await pg.wait_for_timeout(600)
    print(json.dumps({k: v for k, v in (await info(pg)).items() if k != 'actors'}))
