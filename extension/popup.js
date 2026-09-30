const api = globalThis.browser ?? globalThis.chrome;
const labels = {
  loading: 'Waiting for the page to load.',
  'native-dark': 'This website already uses dark mode.',
  darkened: 'Dark mode applied.',
  excluded: 'This website is left unchanged.',
  'system-light': 'Your Mac is in light mode.'
};
const mode = document.querySelector('#mode');
let tab;
async function refresh() {
  try {
    [tab] = await api.tabs.query({ active: true, currentWindow: true });
    const result = await api.tabs.sendMessage(tab.id, { type: 'shade-status' }, { frameId: 0 });
    document.querySelector('#system').textContent = `System appearance: ${result.systemDark ? 'Dark' : 'Light'}`;
    document.querySelector('#status').textContent = labels[result.state] ?? 'Checking this website…';
    document.querySelector('#hostname').textContent = result.hostname;
    mode.value = result.mode;
    mode.disabled = false;
  } catch {
    document.querySelector('#status').textContent = 'Open a website and allow System Shade access in Safari.';
  }
}
mode.addEventListener('change', async () => {
  mode.disabled = true;
  try {
    const hostname = new URL(tab.url).hostname;
    await api.storage.local.set({ [`site:${hostname}`]: mode.value });
    setTimeout(refresh, 300);
  } catch {
    document.querySelector('#status').textContent = 'Could not save. Please reopen this panel.';
    mode.disabled = false;
  }
});
refresh();
