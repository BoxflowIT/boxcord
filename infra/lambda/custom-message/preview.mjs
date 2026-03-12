#!/usr/bin/env node
/**
 * Preview Cognito email templates in the browser.
 *
 * Usage:
 *   node infra/lambda/custom-message/preview.mjs
 *
 * Opens signup, reset and admin-invite emails as HTML files.
 */

import { handler } from './index.mjs';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, 'preview');
mkdirSync(outDir, { recursive: true });

const scenarios = [
  {
    name: 'signup',
    event: {
      triggerSource: 'CustomMessage_SignUp',
      userName: 'anna@boxflow.com',
      request: {
        codeParameter: '482916',
        userAttributes: { given_name: 'Anna', email: 'anna@boxflow.com' },
      },
      response: {},
    },
  },
  {
    name: 'forgot-password',
    event: {
      triggerSource: 'CustomMessage_ForgotPassword',
      userName: 'erik@boxflow.com',
      request: {
        codeParameter: '739201',
        userAttributes: { given_name: 'Erik', email: 'erik@boxflow.com' },
      },
      response: {},
    },
  },
  {
    name: 'admin-invite',
    event: {
      triggerSource: 'CustomMessage_AdminCreateUser',
      userName: 'ny.kollega@boxflow.com',
      request: {
        usernameParameter: 'Tmp$ecure99!',
        userAttributes: { email: 'ny.kollega@boxflow.com' },
      },
      response: {},
    },
  },
  {
    name: 'resend-code',
    event: {
      triggerSource: 'CustomMessage_ResendCode',
      userName: 'anna@boxflow.com',
      request: {
        codeParameter: '115823',
        userAttributes: { given_name: 'Anna', email: 'anna@boxflow.com' },
      },
      response: {},
    },
  },
];

async function main() {
  const files = [];

  for (const { name, event } of scenarios) {
    const result = await handler(event);
    const html = result.response.emailMessage;
    const subject = result.response.emailSubject;
    const filePath = join(outDir, `${name}.html`);
    writeFileSync(filePath, html, 'utf-8');
    files.push({ name, subject, filePath });
    console.log(`✅ ${name}: "${subject}" → ${filePath}`);
  }

  // Create an index page linking all previews
  const indexHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Email Preview</title>
<style>body{font-family:system-ui;max-width:600px;margin:40px auto;color:#333}
a{display:block;padding:12px 0;font-size:18px;color:#5865f2}h1{margin-bottom:8px}</style>
</head><body>
<h1>Boxcord Email Templates</h1>
<p style="color:#666">Click to preview each email:</p>
${files.map((f) => `<a href="${f.name}.html">${f.name} — ${f.subject}</a>`).join('\n')}
</body></html>`;
  const indexPath = join(outDir, 'index.html');
  writeFileSync(indexPath, indexHtml, 'utf-8');

  console.log(`\n📂 Open: ${indexPath}`);

  // Try to open in browser
  try {
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${cmd} "${indexPath}"`);
  } catch {
    // No browser available (e.g. headless server) — user can open manually
  }
}

main();
