import { test } from '@playwright/test';

const routes = ['/', '/nodos', '/rutas', '/splitters', '/empalmes', '/config', '/status', '/login'];

for (const route of routes) {
  test(`capture ${route}`, async ({ page }) => {
    const url = route;
    await page.goto(url, { waitUntil: 'networkidle' });
    // small wait to let animations settle
    await page.waitForTimeout(700);

    // Try to open search dropdown (if present)
    try {
      const search = page.getByPlaceholder('Buscar nodos, coordenadas o clientes...');
      await search.click({ timeout: 1500 });
      await page.waitForTimeout(300);
    } catch (e) {
      // ignore if not present
    }

    // If on root map, try a couple of map toolbar interactions (non-destructive)
    if (route === '/') {
      try {
        await page.waitForSelector('.map-full-container', { timeout: 4000 });
        // open location selector if available
        const lugar = page.getByText('Lugar', { exact: false });
        if (await lugar.count() > 0) {
          await lugar.first().click({ timeout: 1200 });
          await page.waitForTimeout(400);
        }
      } catch (e) {
        // ignore
      }
    }

    const fileName = route === '/' ? 'index' : route.replace(/\//g, '_').replace(/^_/, '');
    await page.screenshot({ path: `tools/screenshot/output/${fileName}.png`, fullPage: true });
  });
}
