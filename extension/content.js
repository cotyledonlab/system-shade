(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const system = matchMedia('(prefers-color-scheme: dark)');
  const key = `site:${location.hostname}`;
  let mode = 'auto';
  let state = 'loading';
  let timer;
  let ready = false;
  let revision = 0;
  // Use the browser's normal fetch; the engine never contacts a third-party service.
  DarkReader.setFetchMethod((url) => fetch(url, { credentials: 'omit' }));
  function apply() {
    if (!ready) return;
    clearTimeout(timer);
    const current = ++revision;
    DarkReader.disable();
    if (!system.matches || mode === 'off') {
      state = mode === 'off' ? 'excluded' : 'system-light';
      return;
    }
    // Let the site's own media queries and theme listeners settle before sampling.
    timer = setTimeout(() => {
      if (revision !== current) return;
      if (mode !== 'force' && ShadeAppearance.isNativeDark()) {
        state = 'native-dark';
      } else {
        DarkReader.enable({ brightness: 100, contrast: 100, darkSchemeBackgroundColor: '#181a1b', darkSchemeTextColor: '#e8e6e3' });
        state = 'darkened';
      }
    }, 160);
  }
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (message.type !== 'shade-status') return;
    respond({ state, mode, systemDark: system.matches, hostname: location.hostname });
  });
  api.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[key]) {
      mode = changes[key].newValue ?? 'auto';
      apply();
    }
  });
  system.addEventListener('change', apply);
  const stored = api.storage.local.get(key).then(values => { mode = values[key] ?? 'auto'; }).catch(() => {});
  async function start() {
    await stored;
    ready = true;
    apply();
    const observer = new MutationObserver(apply);
    for (const node of [document.documentElement, document.body]) {
      observer.observe(node, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-color-mode', 'data-bs-theme', 'color-scheme'] });
    }
    window.addEventListener('load', apply, { once: true });
    // Catch themes initialized after load without continuously polling the page.
    setTimeout(apply, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
