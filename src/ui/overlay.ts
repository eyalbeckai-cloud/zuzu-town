// DOM overlays for grown-ups: parental gate, settings, store.
import { t, setLang, detectLang, getLang } from '../i18n';
import { sound } from '../engine/audio';
import { store } from '../iap';
import { openExternal, isNative } from '../platform';
import { PRIVACY_URL, VERSION } from '../config';

interface AppLike {
  world: any;
  markDirty(): void;
  saveNow(): Promise<void>;
  isLocked(loc: string): boolean;
}

import { petArt } from '../art/characters';
import { ITEMS } from '../game/things/items';

function heroImgs() {
  const u = (s: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const cup = ITEMS.find((i) => i.id === 'cupcake')!;
  const don = ITEMS.find((i) => i.id === 'donut')!;
  return [u(cup.art.art('b3')), u(petArt('dog', 1).svg), u(petArt('cat', 0).svg), u(don.art.art('b3'))].map((s) => `<img src="${s}" alt="">`).join('');
}

export class Overlay {
  app: AppLike;
  el: HTMLDivElement | null = null;
  private onPass: (() => void) | null = null;
  private view: 'gate' | 'parents' | 'store' | null = null;
  private resetArmed = false;
  private storeLoc = '';

  constructor(app: AppLike) { this.app = app; }

  applyLang() {
    const s = this.app.world.settings.lang;
    setLang(s === 'auto' ? detectLang() : s);
  }

  isOpen() { return !!this.el; }

  close() {
    this.el?.remove();
    this.el = null;
    this.view = null;
    this.resetArmed = false;
  }

  private shell(inner: string, cls = '') {
    this.el?.remove();
    const ui = document.getElementById('ui')!;
    const el = document.createElement('div');
    el.className = 'ov ' + cls;
    el.dir = getLang() === 'he' ? 'rtl' : 'ltr';
    el.innerHTML = `<div class="ov-card">${inner}</div>`;
    el.addEventListener('pointerdown', (e) => { if (e.target === el) { this.close(); sound.play('click'); } });
    ui.appendChild(el);
    this.el = el;
    return el;
  }

  /** require a grown-up before running cb */
  gate(cb: () => void) {
    this.onPass = cb;
    this.view = 'gate';
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    const ans = a * b;
    const opts = new Set<number>([ans]);
    while (opts.size < 4) {
      const v = ans + (Math.floor(Math.random() * 9) - 4) * (Math.random() < 0.5 ? 1 : a);
      if (v > 0 && v !== ans) opts.add(v);
    }
    const arr = [...opts].sort(() => Math.random() - 0.5);
    const el = this.shell(`
      <button class="ov-x" aria-label="${t('parents.close')}">✕</button>
      <h2>${t('gate.title')}</h2>
      <p class="ov-q">${t('gate.q', { a, b })}</p>
      <div class="ov-grid">${arr.map((v) => `<button class="ov-num" data-v="${v}">${v}</button>`).join('')}</div>
      <p class="ov-msg"></p>`, 'gate');
    el.querySelector('.ov-x')!.addEventListener('click', () => this.close());
    el.querySelectorAll<HTMLButtonElement>('.ov-num').forEach((b) => {
      b.onclick = () => {
        if (Number(b.dataset.v) === ans) {
          sound.play('ding');
          const cb2 = this.onPass;
          this.onPass = null;
          cb2?.();
        } else {
          sound.play('lock');
          const m = el.querySelector('.ov-msg')!;
          m.textContent = t('gate.wrong');
          setTimeout(() => { if (this.view === 'gate') this.close(); }, 900);
        }
      };
    });
  }

  openParents() {
    this.gate(() => this.showParents());
  }

  showParents() {
    this.view = 'parents';
    const w = this.app.world;
    const s = w.settings;
    const owned = store.owned();
    const el = this.shell(`
      <button class="ov-x" aria-label="${t('parents.close')}">✕</button>
      <h2>${t('parents.title')}</h2>
      <div class="ov-rows">
        <div class="ov-row"><span>${t('parents.music')}</span><button class="ov-tog ${s.music ? 'on' : ''}" data-k="music">${s.music ? t('parents.on') : t('parents.off')}</button></div>
        <div class="ov-row"><span>${t('parents.sfx')}</span><button class="ov-tog ${s.sfx ? 'on' : ''}" data-k="sfx">${s.sfx ? t('parents.on') : t('parents.off')}</button></div>
        <div class="ov-row"><span>${t('parents.lang')}</span><span class="ov-seg"><button data-l="he" class="${getLang() === 'he' ? 'on' : ''}">עברית</button><button data-l="en" class="${getLang() === 'en' ? 'on' : ''}">English</button></span></div>
      </div>
      ${owned ? `<p class="ov-owned">${t('parents.owned')}</p>` : `<button class="ov-cta" data-a="unlock">${t('parents.unlock')}</button>`}
      <div class="ov-links">
        <button data-a="restore">${t('parents.restore')}</button>
        <button data-a="privacy">${t('parents.privacy')}</button>
        <button data-a="reset" class="danger">${this.resetArmed ? t('parents.resetConfirm') : t('parents.reset')}</button>
      </div>
      <p class="ov-small">${t('parents.about')} · v${VERSION}</p>`, 'parents');
    el.querySelector('.ov-x')!.addEventListener('click', () => this.close());
    el.querySelectorAll<HTMLButtonElement>('.ov-tog').forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.k as 'music' | 'sfx';
        s[k] = !s[k];
        sound.musicOn = s.music;
        sound.sfxOn = s.sfx;
        sound.applyMusic();
        this.app.markDirty();
        sound.play('click');
        this.showParents();
      };
    });
    el.querySelectorAll<HTMLButtonElement>('.ov-seg button').forEach((b) => {
      b.onclick = () => {
        s.lang = b.dataset.l;
        this.applyLang();
        this.app.markDirty();
        sound.play('click');
        this.showParents();
      };
    });
    el.querySelectorAll<HTMLButtonElement>('[data-a]').forEach((b) => {
      b.onclick = async () => {
        const a = b.dataset.a;
        sound.play('click');
        if (a === 'unlock') this.showStore('');
        if (a === 'restore') { await store.restore(); this.toast(store.owned() ? t('store.thanks') : t('parents.restore')); this.showParents(); }
        if (a === 'privacy') openExternal(PRIVACY_URL);
        if (a === 'reset') {
          if (!this.resetArmed) { this.resetArmed = true; this.showParents(); return; }
          await (this.app as any).resetWorld();
        }
      };
    });
  }

  openStore(loc: string) {
    this.storeLoc = loc;
    this.gate(() => this.showStore(loc));
  }

  showStore(loc: string) {
    this.view = 'store';
    this.storeLoc = loc;
    const preview = !isNative();
    const price = store.price || '';
    const owned = store.owned();
    const el = this.shell(`
      <button class="ov-x" aria-label="${t('parents.close')}">✕</button>
      <div class="ov-hero">${heroImgs()}</div>
      <h2>${t('store.title')}</h2>
      <p>${t('store.body')}</p>
      ${owned ? `<p class="ov-owned">${t('parents.owned')}</p>` : `<button class="ov-cta" data-a="buy" ${store.busy ? 'disabled' : ''}>${store.busy ? t('store.busy') : preview ? t('store.preview') : t('store.buy', { price })}</button>`}
      <div class="ov-links"><button data-a="restore">${t('parents.restore')}</button></div>
      <p class="ov-small">${t('store.parentNote')}</p>`, 'store');
    el.querySelector('.ov-x')!.addEventListener('click', () => this.close());
    el.querySelector<HTMLButtonElement>('[data-a="buy"]')?.addEventListener('click', async () => {
      sound.play('click');
      const r = await store.buy();
      if (r === 'preview' || store.owned()) { sound.play('sparkle'); this.toast(t('store.thanks')); this.close(); this.afterUnlock(); }
      else if (r === 'error') this.toast(t('store.error'));
      else this.refresh();
    });
    el.querySelector<HTMLButtonElement>('[data-a="restore"]')?.addEventListener('click', async () => {
      sound.play('click');
      await store.restore();
      if (store.owned()) { this.toast(t('store.thanks')); this.close(); this.afterUnlock(); }
    });
  }

  afterUnlock() {
    this.app.saveNow();
    const a: any = this.app;
    if (this.storeLoc && a.goto && !this.app.isLocked(this.storeLoc)) a.goto(this.storeLoc);
  }

  refresh() {
    if (this.view === 'store') {
      if (store.owned()) { this.close(); this.afterUnlock(); return; }
      this.showStore(this.storeLoc);
    } else if (this.view === 'parents') this.showParents();
  }

  toast(msg: string) {
    const ui = document.getElementById('ui')!;
    const d = document.createElement('div');
    d.className = 'toast';
    d.textContent = msg;
    ui.appendChild(d);
    setTimeout(() => d.classList.add('out'), 1800);
    setTimeout(() => d.remove(), 2400);
  }
}
