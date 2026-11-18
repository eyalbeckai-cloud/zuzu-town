import './ui/styles.css';
import { Stage } from './engine/stage';
import { App } from './game/app';

async function boot() {
  const root = document.getElementById('stage')!;
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  try { await (document as any).fonts?.load?.('800 20px Rubik'); } catch { /* ignore */ }
  const stage = new Stage(root, canvas);
  const app = new App(stage);
  await app.start();
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;bottom:0;left:0;color:#e04848;font:12px monospace;white-space:pre-wrap">${String(e && e.stack || e)}</pre>`);
});
