import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const appearance = readFileSync('extension/appearance.js', 'utf8');
const content = readFileSync('extension/content.js', 'utf8');
const engine = readFileSync('extension/vendor/darkreader.js', 'utf8');
async function setup(page, css = '', dark = true) {
  await page.emulateMedia({ colorScheme: dark ? 'dark' : 'light' });
  await page.setContent(`<style>body { margin:0; min-height:100vh; background:white; color:black } ${css}</style><main><h1>Website</h1><p>Readable text</p><img alt="Sample" width="10" height="10" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10'%3E%3Crect width='10' height='10' fill='red'/%3E%3C/svg%3E"></main>`);
  await page.evaluate(() => {
    window.storageListeners = [];
    window.browser = {
      storage: { local: { get: async () => ({}) }, onChanged: { addListener: fn => storageListeners.push(fn) } },
      runtime: { onMessage: { addListener: fn => { window.getShadeStatus = () => new Promise(resolve => fn({ type:'shade-status' }, {}, resolve)); } } }
    };
  });
  await page.addScriptTag({ content: engine });
  await page.addScriptTag({ content: appearance });
  await page.addScriptTag({ content });
}
const status = page => page.evaluate(() => getShadeStatus());
test('light website darkens, follows system changes, and restores original colors', async ({ page }) => {
  await setup(page);
  await expect.poll(async () => (await status(page)).state).toBe('darkened');
  await expect.poll(() => page.evaluate(() => ShadeAppearance.luminance(getComputedStyle(document.body).backgroundColor))).toBeLessThan(.18);
  await expect(page.locator('img')).toHaveCSS('filter', 'none');
  await page.emulateMedia({ colorScheme:'light' });
  await expect.poll(async () => (await status(page)).state).toBe('system-light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await page.emulateMedia({ colorScheme:'dark' });
  await expect.poll(async () => (await status(page)).state).toBe('darkened');
});
test('native media-query dark theme stays untouched', async ({ page }) => {
  await setup(page, '@media(prefers-color-scheme:dark){body{background:#121212;color:#eeeeee}}');
  await expect.poll(async () => (await status(page)).state).toBe('native-dark');
  expect(await page.evaluate(() => DarkReader.isEnabled())).toBe(false);
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)');
});
test('native dark theme using modern CSS colors stays untouched', async ({ page }) => {
  await setup(page, 'body{background:oklch(20% 0 0);color:oklch(95% 0 0)}');
  await expect.poll(async () => (await status(page)).state).toBe('native-dark');
  expect(await page.evaluate(() => DarkReader.isEnabled())).toBe(false);
});
test('dark header alone is not mistaken for a dark page', async ({ page }) => {
  await setup(page, 'h1{background:#111;color:white;height:60px}');
  await expect.poll(async () => (await status(page)).state).toBe('darkened');
});
test('site exclusion and force override update live and still follow system', async ({ page }) => {
  await setup(page, 'body{background:#121212;color:white}');
  await expect.poll(async () => (await status(page)).state).toBe('native-dark');
  const change = value => page.evaluate(value => storageListeners.forEach(fn => fn({ [`site:${location.hostname}`]: { newValue:value } }, 'local')), value);
  await change('force');
  await expect.poll(async () => (await status(page)).state).toBe('darkened');
  await change('off');
  await expect.poll(async () => (await status(page)).state).toBe('excluded');
  expect(await page.evaluate(() => DarkReader.isEnabled())).toBe(false);
  await change('force');
  await page.emulateMedia({ colorScheme:'light' });
  await expect.poll(async () => (await status(page)).state).toBe('system-light');
});
test('late native theme switch removes the generated theme', async ({ page }) => {
  await setup(page, 'body[data-theme="dark"]{background:#121212;color:white}');
  await expect.poll(async () => (await status(page)).state).toBe('darkened');
  await page.evaluate(() => { document.body.dataset.theme = 'dark'; });
  await expect.poll(async () => (await status(page)).state).toBe('native-dark');
  expect(await page.evaluate(() => DarkReader.isEnabled())).toBe(false);
});
test('system light mode never darkens a light page', async ({ page }) => {
  await setup(page, '', false);
  await expect.poll(async () => (await status(page)).state).toBe('system-light');
  expect(await page.evaluate(() => DarkReader.isEnabled())).toBe(false);
});
