import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { browserName: 'webkit', viewport: { width: 1000, height: 700 } },
  workers: 1
});
