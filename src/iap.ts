// In-app purchase wrapper. One non-consumable product unlocks the paid locations.
// No receipt validator / third-party server is used (kids-category friendly).
import { isNative, platformName } from './platform';
import { PACK_FULL } from './game/catalog';

export const PRODUCT_ID = 'full_town';

interface AppHooks {
  world: { owned: Set<string> };
  markDirty(): void;
  overlay: { refresh(): void; toast(msg: string): void };
}

class Store {
  private app: AppHooks | null = null;
  price = '';
  ready = false;
  busy = false;
  private mod: any = null;
  private platform: any = null;

  async init(app: AppHooks) {
    this.app = app;
    if (!isNative()) return;
    try {
      const mod = await import('capacitor-plugin-cdv-purchase');
      this.mod = mod;
      const { store, ProductType, Platform, LogLevel } = mod as any;
      const platform = platformName() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY;
      this.platform = platform;
      store.verbosity = LogLevel?.WARNING ?? 1;
      store.register([{ id: PRODUCT_ID, type: ProductType.NON_CONSUMABLE, platform }]);
      store.when()
        .productUpdated((p: any) => {
          if (p.id !== PRODUCT_ID) return;
          const price = p.pricing?.price;
          if (price) this.price = price;
          if (p.owned) this.grant();
          this.app?.overlay.refresh();
        })
        .approved((tx: any) => {
          const ids: string[] = (tx.products || []).map((x: any) => x.id);
          if (ids.includes(PRODUCT_ID)) this.grant();
          tx.finish();
        })
        .finished(() => { this.busy = false; this.app?.overlay.refresh(); });
      store.error((e: any) => {
        console.warn('store error', e);
        this.busy = false;
        this.app?.overlay.refresh();
      });
      await store.initialize([platform]);
      this.ready = true;
      const p = store.get(PRODUCT_ID, platform);
      if (p?.pricing?.price) this.price = p.pricing.price;
      if (p?.owned) this.grant();
      this.app?.overlay.refresh();
    } catch (e) {
      console.warn('store init failed', e);
    }
  }

  owned() { return !!this.app?.world.owned.has(PACK_FULL); }

  grant() {
    if (!this.app) return;
    if (!this.app.world.owned.has(PACK_FULL)) {
      this.app.world.owned.add(PACK_FULL);
      this.app.markDirty();
    }
    this.busy = false;
    this.app.overlay.refresh();
  }

  async buy(): Promise<'ok' | 'pending' | 'preview' | 'error'> {
    if (!isNative()) {
      // web preview: simulate unlock so the whole game can be tried
      this.grant();
      return 'preview';
    }
    try {
      const { store } = this.mod;
      const p = store.get(PRODUCT_ID, this.platform);
      const offer = p?.getOffer();
      if (!offer) return 'error';
      this.busy = true;
      this.app?.overlay.refresh();
      const err = await offer.order();
      if (err) { this.busy = false; this.app?.overlay.refresh(); return 'error'; }
      return 'pending';
    } catch (e) {
      console.warn(e);
      this.busy = false;
      return 'error';
    }
  }

  async restore() {
    if (!isNative()) return;
    try {
      this.busy = true;
      this.app?.overlay.refresh();
      await this.mod.store.restorePurchases();
    } catch (e) { console.warn(e); }
    this.busy = false;
    this.app?.overlay.refresh();
  }
}

export const store = new Store();
