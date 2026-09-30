/* Detect the visible theme, rather than treating advertised dark support as active. */
(() => {
  function luminance(color) {
    let parts;
    if (/^rgba?\(/.test(color)) parts = color.match(/[\d.]+/g)?.map(Number);
    else {
      // WebKit preserves modern CSS color syntax in computed styles.
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      parts = [...context.getImageData(0, 0, 1, 1).data];
      parts[3] /= 255;
    }
    if (!parts || parts.length < 3 || (parts.length > 3 && parts[3] < 0.5)) return null;
    const rgb = parts.slice(0, 3).map(c => {
      c /= 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  function surfaceAt(element) {
    for (let node = element; node; node = node.parentElement) {
      const value = luminance(getComputedStyle(node).backgroundColor);
      if (value !== null) return value;
    }
    // Transparent documents inherit the browser canvas, including color-scheme.
    const scheme = getComputedStyle(document.documentElement).colorScheme;
    return scheme === 'dark' || (scheme.includes('dark') && matchMedia('(prefers-color-scheme: dark)').matches) ? 0 : 1;
  }
  function isNativeDark() {
    if (!document.body) return false;
    let dark = 0;
    let count = 0;
    for (const x of [0.15, 0.5, 0.85]) {
      for (const y of [0.2, 0.5, 0.8]) {
        const element = document.elementFromPoint(innerWidth * x, innerHeight * y);
        if (!element) continue;
        count++;
        if (surfaceAt(element) < 0.18) dark++;
      }
    }
    return count > 0 && dark / count >= 2 / 3;
  }
  globalThis.ShadeAppearance = { luminance, isNativeDark };
})();
