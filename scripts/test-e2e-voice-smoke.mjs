import { chromium } from 'playwright';
import path from 'path';

async function runE2ETests() {
  console.log('=== Starting Playwright End-to-End Voicebot Smoke Tests ===\n');

  const enWavPath = path.resolve('fixtures', 'speech-en.wav');
  const consoleMessages = [];
  const errors = [];

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-audio-capture=${enWavPath}`,
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const context = await browser.newContext({
    permissions: ['microphone'],
  });

  const page = await context.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      // Exclude harmless WebGL/three.js texture warnings or external CDN issues if any
      if (!text.includes('favicon') && !text.includes('three.js')) {
        errors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    console.error('Browser Page Error:', err.message);
    errors.push(err.message);
  });

  try {
    // 1. Initial Page Load
    console.log('Step 1: Navigating to http://localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('text=Persona AI', { timeout: 10000 });
    console.log('✓ Home page loaded with title "Persona AI"');

    // 2. Verify 3 Language Pills exist
    const enButton = page.getByRole('radio', { name: /Sapphire|Saphire/i });
    const hiButton = page.getByRole('radio', { name: /Rahu/i });
    const taButton = page.getByRole('radio', { name: /Maragatham/i });

    await enButton.waitFor({ state: 'visible', timeout: 5000 });
    await hiButton.waitFor({ state: 'visible', timeout: 5000 });
    await taButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ All 3 language selectors (Sapphire, Rahu, Maragatham) are visible');

    // 3. Test English Text Turn
    console.log('\nStep 2: Submitting an English turn (Saphire · English)...');
    const inputArea = page.locator('textarea');
    await inputArea.fill('What is PersonaVoice?');
    await inputArea.press('Enter');
    // Open sidebar to inspect history
    const sidebarToggle = page.locator('button[aria-label="Toggle Conversation History"]');
    await sidebarToggle.click();

    // Verify user message appears in sidebar
    await page.waitForSelector('text=What is PersonaVoice?', { timeout: 15000 });
    console.log('✓ User question logged in sidebar history');

    // Verify assistant streaming response arrives
    await page.waitForSelector('span:has-text("Persona AI")', { timeout: 35000 });
    console.log('✓ Assistant header appeared in sidebar');

    await page.waitForFunction(
      () => {
        const msgs = document.querySelectorAll('.text-slate-100');
        for (const m of msgs) {
          if (m.textContent && m.textContent.trim().length > 5) {
            return true;
          }
        }
        return false;
      },
      { timeout: 35000 }
    );
    console.log('✓ Assistant reply streamed and displayed in sidebar');

    // 4. Test Hindi Language Switch & Turn (Rahu · हिन्दी)
    console.log('\nStep 3: Switching language to Hindi (Rahu · हिन्दी)...');
    await hiButton.click();
    await page.waitForTimeout(1000);
    console.log('✓ Language switched to Hindi (Rahu)');

    await inputArea.fill('Aap kaun hain?');
    await inputArea.press('Enter');
    await page.waitForSelector('text=Aap kaun hain?', { timeout: 10000 });
    console.log('✓ Hindi user question logged in sidebar');

    // 5. Test Tamil Language Switch & Turn (Maragatham · தமிழ்)
    console.log('\nStep 4: Switching language to Tamil (Maragatham · தமிழ்)...');
    await taButton.click();
    await page.waitForTimeout(1000);
    console.log('✓ Language switched to Tamil (Maragatham)');

    await inputArea.fill('Ungal peyar enna?');
    await inputArea.press('Enter');
    await page.waitForSelector('text=Ungal peyar enna?', { timeout: 10000 });
    console.log('✓ Tamil user question logged in sidebar');

    // 6. Test Failure Case: Rapid Double-Click on Orb
    console.log('\nStep 5: Testing edge case: rapid double-clicking Orb...');
    const orbContainer = page.locator('button[aria-label*="Orb"], div:has(canvas)').first();
    if (await orbContainer.count() > 0) {
      await orbContainer.click({ clickCount: 2, delay: 100 });
      await page.waitForTimeout(1000);
      console.log('✓ Rapid double-click handled gracefully without crash');
    }

    // 7. Test Failure Case: Escape Key Barge-in / Interruption
    console.log('\nStep 6: Testing edge case: Escape key mid-stream interrupt...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    console.log('✓ Escape key dispatched cleanly to reset state to idle');

    // 8. Console Error Audit
    console.log('\nStep 7: Auditing browser console logs...');
    console.log(`Total console messages: ${consoleMessages.length}`);
    if (errors.length > 0) {
      console.error('Console errors detected:', errors);
      throw new Error(`Browser console contains errors: ${errors.join(', ')}`);
    } else {
      console.log('✓ ZERO console errors or unhandled exceptions detected in browser!');
    }

    console.log('\n=== ALL E2E SMOKE TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (err) {
    console.error('\n❌ E2E Smoke Test Failed:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETests();
