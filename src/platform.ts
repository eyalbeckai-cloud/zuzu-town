// Thin platform layer: works on web (preview) and inside the Capacitor native shell.
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platformName = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

const KEY = 'zuzu-town-save-v1';

export async function loadSave(): Promise<string | null> {
  try {
    if (isNative()) {
      const { Preferences } = await import('@capacitor/preferences');
      const r = await Preferences.get({ key: KEY });
      return r.value ?? null;
    }
  } catch (e) {
    console.warn('native load failed', e);
  }
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export async function writeSave(json: string) {
  try {
    if (isNative()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({ key: KEY, value: json });
      return;
    }
  } catch (e) {
    console.warn('native save failed', e);
  }
  try { localStorage.setItem(KEY, json); } catch { /* storage unavailable (private mode / sandbox) */ }
}

export async function clearSave() {
  try {
    if (isNative()) {
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.remove({ key: KEY });
    }
  } catch { /* ignore */ }
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

let hapticsMod: any = null;
export async function haptic(kind: 'light' | 'medium' = 'light') {
  if (!isNative()) return;
  try {
    if (!hapticsMod) hapticsMod = await import('@capacitor/haptics');
    await hapticsMod.Haptics.impact({ style: kind === 'light' ? hapticsMod.ImpactStyle.Light : hapticsMod.ImpactStyle.Medium });
  } catch { /* ignore */ }
}

export async function nativeSetup(onPause: () => void, onResume: () => void, onBack: () => boolean) {
  if (!isNative()) {
    document.addEventListener('visibilitychange', () => (document.hidden ? onPause() : onResume()));
    return;
  }
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('pause', onPause);
    App.addListener('resume', onResume);
    App.addListener('backButton', () => {
      if (!onBack()) App.minimizeApp?.();
    });
  } catch (e) { console.warn(e); }
  try {
    const { StatusBar } = await import('@capacitor/status-bar');
    await StatusBar.hide();
  } catch { /* ignore */ }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    setTimeout(() => SplashScreen.hide(), 300);
  } catch { /* ignore */ }
  document.addEventListener('visibilitychange', () => (document.hidden ? onPause() : onResume()));
}

export function openExternal(url: string) {
  window.open(url, '_blank', 'noopener');
}
