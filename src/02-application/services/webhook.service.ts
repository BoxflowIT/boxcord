// Boxtime Webhook Service - Handles incoming events from Boxtime
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { Server as SocketServer } from 'socket.io';
import { logger } from '../../00-core/logger.js';

// Webhook event types from Boxtime
export type WebhookEventType =
  | 'booking.created'
  | 'booking.updated'
  | 'booking.cancelled'
  | 'staff.joined'
  | 'staff.left'
  | 'office.updated'
  | 'shift.started'
  | 'shift.ended';

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface BookingEventData {
  bookingId: number;
  customerId: number;
  customerName: string;
  staffId: number;
  staffName: string;
  serviceId: number;
  serviceName: string;
  startTime: string;
  endTime: string;
  officeId?: number;
}

export interface StaffEventData {
  staffId: number;
  staffName: string;
  email: string;
  officeId?: number;
}

export class WebhookService {
  constructor(
    private readonly prisma: ExtendedPrismaClient,
    private io?: SocketServer
  ) {}

  setSocketServer(io: SocketServer) {
    this.io = io;
  }

  // Validate webhook signature (simplified - use HMAC in production)
  validateSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // In production, use crypto.createHmac('sha256', secret).update(payload).digest('hex')
    // For development, just check if secret matches
    if (!secret || !signature) return true; // Development mode
    return signature === secret;
  }

  // Process incoming webhook event
  async processEvent(payload: WebhookPayload): Promise<void> {
    switch (payload.event) {
      case 'booking.created':
        await this.handleBookingCreated(
          payload.data as unknown as BookingEventData
        );
        break;
      case 'booking.cancelled':
        await this.handleBookingCancelled(
          payload.data as unknown as BookingEventData
        );
        break;
      case 'staff.joined':
        await this.handleStaffJoined(payload.data as unknown as StaffEventData);
        break;
      case 'shift.started':
        await this.handleShiftStarted(
          payload.data as unknown as StaffEventData
        );
        break;
      case 'shift.ended':
        await this.handleShiftEnded(payload.data as unknown as StaffEventData);
        break;
      default:
        logger.warn(
          { event: payload.event },
          `[WEBHOOK] Unhandled event type: ${payload.event}`
        );
    }
  }

  // Send a bot message to a channel
  private async sendBotMessage(
    channelName: string,
    content: string,
    workspaceId?: string
  ): Promise<void> {
    // Find or create the channel
    let channel = await this.prisma.channel.findFirst({
      where: {
        name: channelName,
        ...(workspaceId && { workspaceId })
      }
    });

    if (!channel) {
      // Try to find a default workspace
      const workspace = workspaceId
        ? await this.prisma.workspace.findUnique({ where: { id: workspaceId } })
        : await this.prisma.workspace.findFirst();

      if (!workspace) {
        logger.warn(
          { channelName, workspaceId },
          `[WEBHOOK] No workspace found for bot message`
        );
        return;
      }

      // Create the channel if it doesn't exist
      channel = await this.prisma.channel.create({
        data: {
          name: channelName,
          description: 'Automatiska meddelanden från Boxtime',
          type: 'ANNOUNCEMENT',
          workspaceId: workspace.id
        }
      });
    }

    // Create the message with a bot author ID
    const BOT_USER_ID = 'boxtime-bot';
    const message = await this.prisma.message.create({
      data: {
        channelId: channel.id,
        authorId: BOT_USER_ID,
        content
      }
    });

    // Emit via socket
    if (this.io) {
      this.io.to(`channel:${channel.id}`).emit('message:new', {
        id: message.id,
        content: message.content,
        authorId: message.authorId,
        channelId: message.channelId,
        createdAt: message.createdAt.toISOString(),
        edited: false,
        isBot: true
      });
    }
  }

  // Handle booking created event
  private async handleBookingCreated(data: BookingEventData): Promise<void> {
    const time = new Date(data.startTime).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const date = new Date(data.startTime).toLocaleDateString('sv-SE');

    await this.sendBotMessage(
      'bokningar',
      `📅 **Ny bokning!**\n` +
        `Kund: ${data.customerName}\n` +
        `Tjänst: ${data.serviceName}\n` +
        `Personal: ${data.staffName}\n` +
        `Tid: ${date} kl ${time}`
    );
  }

  // Handle booking cancelled event
  private async handleBookingCancelled(data: BookingEventData): Promise<void> {
    const time = new Date(data.startTime).toLocaleTimeString('sv-SE', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const date = new Date(data.startTime).toLocaleDateString('sv-SE');

    await this.sendBotMessage(
      'bokningar',
      `❌ **Bokning avbokad**\n` +
        `Kund: ${data.customerName}\n` +
        `Tjänst: ${data.serviceName}\n` +
        `Tid som var: ${date} kl ${time}`
    );
  }

  // Handle staff joined event
  private async handleStaffJoined(data: StaffEventData): Promise<void> {
    await this.sendBotMessage(
      'allmänt',
      `👋 **Välkommen!** ${data.staffName} har gått med i teamet!`
    );
  }

  // Handle shift started event
  private async handleShiftStarted(data: StaffEventData): Promise<void> {
    await this.sendBotMessage(
      'arbetsstatus',
      `🟢 ${data.staffName} har börjat sitt pass`
    );
  }

  // Handle shift ended event
  private async handleShiftEnded(data: StaffEventData): Promise<void> {
    await this.sendBotMessage(
      'arbetsstatus',
      `🔴 ${data.staffName} har avslutat sitt pass`
    );
  }
}
