import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * File Upload/Download E2E Tests
 *
 * Tests file attachment functionality:
 * - Upload images to messages
 * - Upload documents
 * - Download attachments
 * - Verify file size limits
 * - Test multiple file uploads
 *
 * Setup: Requires test files in tests/fixtures/
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const TEST_FILES = {
  image: path.join(__dirname, '../fixtures/test-image.jpg'),
  document: path.join(__dirname, '../fixtures/test-document.pdf'),
  largeFile: path.join(__dirname, '../fixtures/large-file.bin') // >10MB for limit test
};

/**
 * Helper: Setup authenticated page
 */
async function setupAuthenticatedPage(page: Page): Promise<void> {
  const mockToken = Buffer.from(
    JSON.stringify({
      sub: 'test-user-1',
      email: 'test@boxflow.com',
      exp: Math.floor(Date.now() / 1000) + 3600
    })
  ).toString('base64');

  await page.goto(FRONTEND_URL);
  await page.evaluate((token) => {
    localStorage.setItem('auth-token', `Bearer.${token}.sig`);
  }, mockToken);
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * Helper: Create test files if they don't exist
 */
function ensureTestFiles(): void {
  const fixturesDir = path.join(__dirname, '../fixtures');

  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
  }

  // Create small test image (1x1 PNG)
  if (!fs.existsSync(TEST_FILES.image)) {
    const pngData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(TEST_FILES.image, pngData);
  }

  // Create test PDF
  if (!fs.existsSync(TEST_FILES.document)) {
    const pdfData = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 100 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000214 00000 n\ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n%%%EOF'
    );
    fs.writeFileSync(TEST_FILES.document, pdfData);
  }

  // Create large test file (11MB - exceeds 10MB limit)
  if (!fs.existsSync(TEST_FILES.largeFile)) {
    const size = 11 * 1024 * 1024; // 11MB
    const buffer = Buffer.alloc(size, 0);
    fs.writeFileSync(TEST_FILES.largeFile, buffer);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('File Upload - Images', () => {
  test.beforeAll(() => {
    ensureTestFiles();
  });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.waitForTimeout(1000);

    // Navigate to first channel
    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);
    }
  });

  test('should upload image attachment to message', async ({ page }) => {
    // Find file upload button or input
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Upload file
      await fileInput.setInputFiles(TEST_FILES.image);

      await page.waitForTimeout(1000);

      // Verify preview or filename appears
      const imagePreview = await page
        .locator('[data-testid="image-preview"], img[alt*="preview"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      const filenameVisible = await page
        .locator('text=/test-image\\.jpg/i')
        .isVisible()
        .catch(() => false);

      expect(imagePreview || filenameVisible).toBeTruthy();

      // Send message with attachment
      const sendBtn = page.locator(
        '[data-testid="send-message"], button[aria-label*="send"]'
      );
      await sendBtn.click();

      await page.waitForTimeout(1000);

      // Verify message with attachment appears
      const attachmentMessage = page.locator(
        '[data-message-id]:has([data-testid="attachment"])'
      );
      expect(await attachmentMessage.count()).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });

  test('should display uploaded image inline', async ({ page }) => {
    // Upload and send image
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(TEST_FILES.image);
      await page.waitForTimeout(500);

      const sendBtn = page.locator('[data-testid="send-message"]');
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(1000);

        // Verify image displays inline in message
        const inlineImage = page.locator('[data-testid="message"] img');
        expect(await inlineImage.count()).toBeGreaterThan(0);

        // Verify image has valid src
        const imgSrc = await inlineImage.first().getAttribute('src');
        expect(imgSrc).toBeTruthy();
        expect(imgSrc).toMatch(/^https?:\/\/|^\/uploads\//);
      }
    }
  });
});

test.describe('File Upload - Documents', () => {
  test.beforeAll(() => {
    ensureTestFiles();
  });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.waitForTimeout(1000);

    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);
    }
  });

  test('should upload PDF document', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(TEST_FILES.document);
      await page.waitForTimeout(1000);

      // Verify PDF indicator appears
      const pdfIndicator = await page
        .locator('text=/\\.pdf|PDF/i')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(pdfIndicator).toBeTruthy();

      // Send message
      const sendBtn = page.locator('[data-testid="send-message"]');
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(1000);

        // Verify attachment in message list
        const attachmentLink = page.locator(
          '[data-testid="attachment-link"], a[href*=".pdf"]'
        );
        expect(await attachmentLink.count()).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('File Upload - Size Limits', () => {
  test.beforeAll(() => {
    ensureTestFiles();
  });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.waitForTimeout(1000);

    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);
    }
  });

  test('should reject files larger than 10MB', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Try to upload large file
      await fileInput.setInputFiles(TEST_FILES.largeFile);
      await page.waitForTimeout(1000);

      // Should show error message
      const errorMessage = await page
        .locator('text=/too large|exceeds|10.*MB|size limit/i')
        .isVisible({ timeout: 3000 })
        .catch(() => false);

      expect(errorMessage).toBeTruthy();

      // Send button should be disabled or file not attached
      const sendBtn = page.locator('[data-testid="send-message"]');
      const isDisabled = await sendBtn.isDisabled().catch(() => false);

      const noAttachment = !(await page
        .locator('[data-testid="attachment-preview"]')
        .isVisible()
        .catch(() => false));

      expect(isDisabled || noAttachment).toBeTruthy();
    }
  });
});

test.describe('File Download', () => {
  test.beforeAll(() => {
    ensureTestFiles();
  });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.waitForTimeout(1000);

    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);
    }
  });

  test('should download file attachment', async ({ page }) => {
    // First upload a file
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(TEST_FILES.image);
      await page.waitForTimeout(500);

      const sendBtn = page.locator('[data-testid="send-message"]');
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(1000);

        // Find download button or link
        const downloadBtn = page
          .locator('[data-testid="download-attachment"], a[download]')
          .first();

        if (await downloadBtn.isVisible().catch(() => false)) {
          // Listen for download
          const downloadPromise = page.waitForEvent('download');
          await downloadBtn.click();

          const download = await downloadPromise;

          // Verify download started
          expect(download.suggestedFilename()).toBeTruthy();

          // Verify file downloads to correct location
          const path = await download.path();
          expect(path).toBeTruthy();
        }
      }
    }
  });

  test('should open image in lightbox/modal', async ({ page }) => {
    // Upload image
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await fileInput.setInputFiles(TEST_FILES.image);
      await page.waitForTimeout(500);

      const sendBtn = page.locator('[data-testid="send-message"]');
      if (await sendBtn.isVisible().catch(() => false)) {
        await sendBtn.click();
        await page.waitForTimeout(1000);

        // Click image to open lightbox
        const inlineImage = page.locator('[data-testid="message"] img').first();
        if (await inlineImage.isVisible().catch(() => false)) {
          await inlineImage.click();
          await page.waitForTimeout(500);

          // Verify modal/lightbox opened
          const lightbox = page.locator(
            '[data-testid="image-modal"], [role="dialog"]'
          );
          const isVisible = await lightbox
            .isVisible({ timeout: 2000 })
            .catch(() => false);

          expect(isVisible).toBeTruthy();
        }
      }
    }
  });
});

test.describe('Multiple File Upload', () => {
  test.beforeAll(() => {
    ensureTestFiles();
  });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.waitForTimeout(1000);

    const firstChannel = page.locator('[data-channel-id]').first();
    if (await firstChannel.isVisible().catch(() => false)) {
      await firstChannel.click();
      await page.waitForTimeout(500);
    }
  });

  test('should upload multiple files at once', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check if input allows multiple files
      const multipleAllowed = await fileInput.getAttribute('multiple');

      if (multipleAllowed !== null) {
        // Upload both image and document
        await fileInput.setInputFiles([TEST_FILES.image, TEST_FILES.document]);
        await page.waitForTimeout(1000);

        // Verify both files show in preview
        const previews = page.locator('[data-testid="attachment-preview"]');
        const count = await previews.count();

        expect(count).toBe(2);

        // Send message
        const sendBtn = page.locator('[data-testid="send-message"]');
        if (await sendBtn.isVisible().catch(() => false)) {
          await sendBtn.click();
          await page.waitForTimeout(1000);

          // Verify message has multiple attachments
          const attachments = page.locator('[data-testid="attachment"]');
          expect(await attachments.count()).toBeGreaterThan(1);
        }
      }
    }
  });
});
