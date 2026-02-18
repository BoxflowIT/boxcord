import sgMail from '@sendgrid/mail';
import { config, features } from '../../00-core/config.js';
import { createLogger } from '../../00-core/logger.js';

const logger = createLogger('email-service');

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
}

class EmailService {
  private initialized = false;

  constructor() {
    if (!features.email) {
      logger.info('Email service is disabled (no SENDGRID_API_KEY configured)');
      return;
    }

    sgMail.setApiKey(config.SENDGRID_API_KEY!);
    this.initialized = true;
    logger.info('SendGrid email service initialized');
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.initialized) {
      logger.warn('Email service not configured, skipping email send');
      return;
    }

    const { to, subject, text, html, cc, bcc } = options;

    // SendGrid requires at least text or html
    if (!text && !html) {
      throw new Error('Email must have either text or html content');
    }

    try {
      const emailData: sgMail.MailDataRequired = {
        from: config.SENDGRID_FROM_EMAIL!,
        to,
        subject,
        text: text || '',
        ...(html && { html }),
        ...(cc && { cc }),
        ...(bcc && { bcc })
      };

      await sgMail.send(emailData);

      logger.info({ to, subject }, 'Email sent successfully');
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      throw error;
    }
  }

  /**
   * Send mention notification email
   */
  async sendMentionNotification(
    userEmail: string,
    mentionedBy: string,
    channelName: string,
    messagePreview: string,
    messageUrl: string
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: `${mentionedBy} mentioned you in #${channelName}`,
      text: `${mentionedBy} mentioned you in #${channelName}:\n\n"${messagePreview}"\n\nView message: ${messageUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>You were mentioned in Boxcord</h2>
          <p><strong>${mentionedBy}</strong> mentioned you in <strong>#${channelName}</strong>:</p>
          <blockquote style="border-left: 4px solid #5865F2; padding-left: 16px; margin: 16px 0; color: #666;">
            ${messagePreview}
          </blockquote>
          <a href="${messageUrl}" style="display: inline-block; background: #5865F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
            View Message
          </a>
        </div>
      `
    });
  }

  /**
   * Send DM notification email
   */
  async sendDMNotification(
    userEmail: string,
    senderName: string,
    messagePreview: string,
    dmUrl: string
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: `New message from ${senderName}`,
      text: `${senderName} sent you a message:\n\n"${messagePreview}"\n\nView message: ${dmUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Direct Message</h2>
          <p><strong>${senderName}</strong> sent you a message:</p>
          <blockquote style="border-left: 4px solid #5865F2; padding-left: 16px; margin: 16px 0; color: #666;">
            ${messagePreview}
          </blockquote>
          <a href="${dmUrl}" style="display: inline-block; background: #5865F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
            Reply
          </a>
        </div>
      `
    });
  }

  /**
   * Send workspace invite email
   */
  async sendWorkspaceInvite(
    userEmail: string,
    workspaceName: string,
    invitedBy: string,
    inviteUrl: string
  ): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: `You've been invited to ${workspaceName}`,
      text: `${invitedBy} invited you to join ${workspaceName} on Boxcord.\n\nAccept invitation: ${inviteUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Workspace Invitation</h2>
          <p><strong>${invitedBy}</strong> invited you to join:</p>
          <h3 style="color: #5865F2;">${workspaceName}</h3>
          <a href="${inviteUrl}" style="display: inline-block; background: #5865F2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">
            Accept Invitation
          </a>
        </div>
      `
    });
  }

  /**
   * Check if email service is enabled
   */
  isEnabled(): boolean {
    return this.initialized;
  }
}

export const emailService = new EmailService();
