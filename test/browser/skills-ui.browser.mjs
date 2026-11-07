// Opt-in real-browser checks (npm run test:browser). Skips cleanly without Playwright/Chromium.
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { launch, startServer } from './harness.mjs';

const launched = await launch();
const skip = launched.skip;
if (skip) console.log(`# test:browser skipped: ${skip}`);

describe('Skill manager in a real browser', { skip }, () => {
  let server;
  const { browser } = launched;
  before(async () => {
    server = await startServer();
  });
  after(async () => {
    await browser?.close();
    await server?.close();
  });

  const open = async (lang = 'en', width = 760) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(server.url(lang));
    await page.waitForSelector('.waycraft-skills');
    await page.evaluate(() =>
      document
        .querySelectorAll('.waycraft-skills-source')
        .forEach((d) => (d.open = true)),
    );
    return page;
  };

  test('switch markup and size match the host control', async () => {
    const page = await open();
    const sw = page.locator('button.waycraft-skills-switch').first();
    assert.equal(await sw.getAttribute('role'), 'switch');
    assert.ok(
      ['true', 'false'].includes(await sw.getAttribute('aria-checked')),
    );
    const box = await sw.boundingBox();
    assert.deepEqual([Math.round(box.width), Math.round(box.height)], [36, 20]);
    await page.close();
  });

  for (const lang of ['en', 'ar']) {
    test(`drag assigns a skill to a category within its source (${lang})`, async () => {
      const page = await open(lang);
      await page.evaluate(() =>
        fetch('api/waycraft-skills.catalog', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-waycraft-skills': '1',
          },
          body: JSON.stringify({
            action: 'category-create',
            source: 'base',
            name: `Work-${lang}`,
          }),
        }),
      );
      await page
        .locator('button[data-waycraft-skills-refresh]')
        .first()
        .click();
      await page.waitForSelector('.waycraft-skills-catsec');
      await page.evaluate(() =>
        document
          .querySelectorAll('.waycraft-skills-source, .waycraft-skills-catbody')
          .forEach((d) => (d.open = true)),
      );
      const sent = [];
      page.on('request', (r) => {
        if (r.method() === 'POST') sent.push(r.postData() ?? '');
      });
      // The uncategorised section is last; its first row moves into this run's new category.
      const row = page
        .locator('.waycraft-skills-catsec')
        .last()
        .locator('.waycraft-skills-row[draggable=true]')
        .first();
      const name = await row.getAttribute('data-waycraft-skill');
      const work = page
        .locator('.waycraft-skills-catsec')
        .filter({ hasText: `Work-${lang}` })
        .first();
      await row.dragTo(work);
      await page.waitForTimeout(600);
      assert.ok(
        sent.some(
          (body) =>
            body.includes('"category-assign"') || body.includes('category-'),
        ),
        `no category action sent for ${name}`,
      );
      assert.ok(!sent.some((body) => body.includes('category-move')));
      await page.close();
    });
  }

  test('dialog traps focus, closes on Escape and returns focus to its trigger', async () => {
    const page = await open();
    const trigger = page.locator('button[aria-label="Create skill"]').first();
    await trigger.focus();
    await trigger.click();
    const dialog = page.locator('[role=dialog]');
    await dialog.waitFor();
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      assert.equal(
        await dialog.evaluate((d) => d.contains(document.activeElement)),
        true,
        `focus escaped on Tab ${i}`,
      );
    }
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    assert.equal(
      await trigger.evaluate((t) => t === document.activeElement),
      true,
    );
    await page.close();
  });

  test('per-source diagnostics disclosure opens from the problem badge', async () => {
    const page = await open();
    const badge = page.locator('[data-waycraft-source-problems]').first();
    await badge.waitFor();
    await badge.click();
    const region = page.locator('.waycraft-skills-diagregion').first();
    await region.waitFor();
    assert.equal(await region.evaluate((d) => d.open), true);
    await page.close();
  });
});
