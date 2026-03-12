/**
 * Cognito CustomMessage Lambda Trigger
 *
 * Styles verification and password-reset emails to match the Boxcord design.
 * Attach to Cognito User Pool → Triggers → Custom message.
 */

const BRAND = {
  name: 'Boxcord',
  url: 'https://boxcord.boxflow.com',
  logo: 'https://boxcord.boxflow.com/logo-128.png',
  company: 'Boxflow IT',
  website: 'https://boxflow.com',
  primaryColor: '#5865f2',
  primaryDark: '#4752c4',
  bgDarkest: '#111214',
  bgDarker: '#1a1c1f',
  bgDark: '#23252a',
  textLight: '#e0e0e6',
  textMuted: '#8b8d94',
  borderColor: 'rgba(255,255,255,0.08)',
};

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgDarkest};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgDarkest};padding:40px 0;">
<tr><td align="center">

  <!-- Card -->
  <table width="520" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgDarker};border:1px solid ${BRAND.borderColor};border-radius:12px;overflow:hidden;">

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryDark});padding:28px 40px;text-align:center;">
        <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">${BRAND.name}</span>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:36px 40px 28px;color:${BRAND.textLight};font-size:15px;line-height:1.6;">
        ${body}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:20px 40px 28px;border-top:1px solid ${BRAND.borderColor};text-align:center;font-size:12px;color:${BRAND.textMuted};">
        &copy; ${new Date().getFullYear()} ${BRAND.company} &middot;
        <a href="${BRAND.website}" target="_blank" rel="noopener" style="color:${BRAND.primaryColor};text-decoration:none;">boxflow.com</a>
      </td>
    </tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}

function codeBlock(code) {
  return `<div style="margin:24px 0;text-align:center;">
  <span style="display:inline-block;font-size:32px;font-weight:700;letter-spacing:6px;color:#ffffff;background-color:${BRAND.bgDark};border:1px solid ${BRAND.borderColor};border-radius:8px;padding:14px 28px;">
    ${code}
  </span>
</div>`;
}

function ctaButton(text, href) {
  return `<div style="margin:28px 0;text-align:center;">
  <a href="${href}" target="_blank" rel="noopener" style="display:inline-block;background:linear-gradient(135deg,${BRAND.primaryColor},${BRAND.primaryDark});color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
    ${text}
  </a>
</div>`;
}

export const handler = async (event) => {
  const { triggerSource, request, userName } = event;
  const code = request.codeParameter || '{####}';
  const name = request.userAttributes?.given_name || userName || '';

  switch (triggerSource) {
    // ── Sign-up verification ───────────────────────────────────
    case 'CustomMessage_SignUp':
    case 'CustomMessage_ResendCode': {
      const greeting = name ? `Hej ${name},` : 'Hej,';
      event.response.emailSubject = 'Verifiera din e-post — Boxcord';
      event.response.emailMessage = layout('Verifiera din e-post', `
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#ffffff;">${greeting}</p>
        <p style="margin:0 0 8px;">Välkommen till <strong>Boxcord</strong>! Ange koden nedan för att verifiera din e-postadress:</p>
        ${codeBlock(code)}
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">Koden är giltig i 24 timmar. Om du inte registrerade dig kan du ignorera detta mail.</p>
      `);
      break;
    }

    // ── Forgot password ────────────────────────────────────────
    case 'CustomMessage_ForgotPassword': {
      const greeting = name ? `Hej ${name},` : 'Hej,';
      event.response.emailSubject = 'Återställ ditt lösenord — Boxcord';
      event.response.emailMessage = layout('Återställ lösenord', `
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#ffffff;">${greeting}</p>
        <p style="margin:0 0 8px;">Du har begärt att återställa ditt lösenord. Ange koden nedan:</p>
        ${codeBlock(code)}
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">Koden är giltig i 1 timme. Om du inte begärde detta kan du ignorera mailet — ditt lösenord förblir oförändrat.</p>
      `);
      break;
    }

    // ── Admin-created user (temporary password) ────────────────
    case 'CustomMessage_AdminCreateUser': {
      const tempPass = request.usernameParameter || '{username}';
      event.response.emailSubject = 'Välkommen till Boxcord';
      event.response.emailMessage = layout('Välkommen till Boxcord', `
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#ffffff;">Hej,</p>
        <p style="margin:0 0 8px;">Ett konto har skapats åt dig på <strong>Boxcord</strong>.</p>
        <p style="margin:0 0 4px;">Ditt tillfälliga lösenord:</p>
        ${codeBlock(tempPass)}
        <p style="margin:0 0 16px;">Logga in och välj ett nytt lösenord:</p>
        ${ctaButton('Logga in', BRAND.url + '/login')}
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">Det tillfälliga lösenordet är giltigt i 7 dagar.</p>
      `);
      break;
    }

    // ── MFA / Verify user attribute ────────────────────────────
    case 'CustomMessage_VerifyUserAttribute': {
      event.response.emailSubject = 'Verifiera din e-post — Boxcord';
      event.response.emailMessage = layout('Verifiera e-post', `
        <p style="margin:0 0 8px;">Ange koden nedan för att verifiera din e-postadress:</p>
        ${codeBlock(code)}
        <p style="margin:0;font-size:13px;color:${BRAND.textMuted};">Om du inte begärde detta kan du ignorera mailet.</p>
      `);
      break;
    }

    default:
      // Unknown trigger – pass through without customization
      break;
  }

  return event;
};
