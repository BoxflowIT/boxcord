// Chatbot Service - Slash Commands and Bot Responses
import type { ExtendedPrismaClient } from '../../03-infrastructure/database/client.js';
import type { Server as SocketServer } from 'socket.io';

// Slash command types
export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  execute: (args: string[], context: CommandContext) => Promise<CommandResult>;
}

export interface CommandContext {
  userId: string;
  channelId: string;
  workspaceId?: string;
}

export interface CommandResult {
  content: string;
  isPrivate?: boolean; // Only show to the user who executed
  ephemeral?: boolean; // Auto-delete after showing
}

const BOT_USER_ID = 'boxcord-bot';

export class ChatbotService {
  private commands: Map<string, SlashCommand> = new Map();

  constructor(
    private readonly prisma: ExtendedPrismaClient,
    private io?: SocketServer
  ) {
    this.registerDefaultCommands();
  }

  setSocketServer(io: SocketServer) {
    this.io = io;
  }

  private registerDefaultCommands() {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Visa tillgängliga kommandon',
      usage: '/help [kommando]',
      execute: async (args) => {
        if (args.length > 0) {
          const cmd = this.commands.get(args[0]);
          if (cmd) {
            return {
              content: `**/${cmd.name}**\n${cmd.description}\n\nAnvändning: \`${cmd.usage}\``,
              isPrivate: true
            };
          }
          return { content: `❌ Okänt kommando: ${args[0]}`, isPrivate: true };
        }

        const commandList = Array.from(this.commands.values())
          .map((cmd) => `• \`/${cmd.name}\` - ${cmd.description}`)
          .join('\n');

        return {
          content: `**📚 Tillgängliga kommandon:**\n${commandList}`,
          isPrivate: true
        };
      }
    });

    // Status command
    this.registerCommand({
      name: 'status',
      description: 'Visa eller ändra din status',
      usage: '/status [online|away|busy|offline]',
      execute: async (args, context) => {
        if (args.length === 0) {
          const presence = await this.prisma.userPresence.findUnique({
            where: { userId: context.userId }
          });
          const status = presence?.status ?? 'OFFLINE';
          const statusEmoji = {
            ONLINE: '🟢',
            AWAY: '🟡',
            BUSY: '🔴',
            OFFLINE: '⚫'
          };
          return {
            content: `Din nuvarande status: ${statusEmoji[status as keyof typeof statusEmoji] ?? '⚫'} ${status}`,
            isPrivate: true
          };
        }

        const newStatus = args[0].toUpperCase();
        if (!['ONLINE', 'AWAY', 'BUSY', 'OFFLINE'].includes(newStatus)) {
          return {
            content: '❌ Ogiltig status. Välj: online, away, busy, offline',
            isPrivate: true
          };
        }

        await this.prisma.userPresence.upsert({
          where: { userId: context.userId },
          update: {
            status: newStatus as 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'
          },
          create: {
            userId: context.userId,
            status: newStatus as 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'
          }
        });

        return {
          content: `✅ Din status är nu: ${newStatus.toLowerCase()}`,
          isPrivate: true
        };
      }
    });

    // Who command - show channel members
    this.registerCommand({
      name: 'who',
      description: 'Visa vilka som är i kanalen',
      usage: '/who',
      execute: async (_, context) => {
        const members = await this.prisma.channelMember.findMany({
          where: { channelId: context.channelId },
          take: 20
        });

        if (members.length === 0) {
          return { content: 'Inga medlemmar i denna kanal', isPrivate: true };
        }

        const users = await this.prisma.user.findMany({
          where: { id: { in: members.map((m) => m.userId) } },
          include: { presence: true }
        });

        const statusEmoji = {
          ONLINE: '🟢',
          AWAY: '🟡',
          BUSY: '🔴',
          OFFLINE: '⚫'
        };

        const userList = users
          .map((u) => {
            const status = u.presence?.status ?? 'OFFLINE';
            const name = u.firstName
              ? `${u.firstName} ${u.lastName ?? ''}`.trim()
              : u.email;
            return `${statusEmoji[status as keyof typeof statusEmoji]} ${name}`;
          })
          .join('\n');

        return {
          content: `**👥 Kanalmedlemmar:**\n${userList}`,
          isPrivate: true
        };
      }
    });

    // Clear command - clear messages (admin only)
    this.registerCommand({
      name: 'clear',
      description: 'Rensa meddelanden i kanalen (endast admin)',
      usage: '/clear [antal]',
      execute: async (args, context) => {
        const count = args[0] ? parseInt(args[0], 10) : 10;
        if (isNaN(count) || count < 1 || count > 100) {
          return {
            content: '❌ Ange ett antal mellan 1-100',
            isPrivate: true
          };
        }

        // Check if user is admin (simplified check)
        const channel = await this.prisma.channel.findUnique({
          where: { id: context.channelId },
          include: {
            workspace: {
              include: {
                members: {
                  where: {
                    userId: context.userId,
                    role: { in: ['OWNER', 'ADMIN'] }
                  }
                }
              }
            }
          }
        });

        if (!channel?.workspace.members.length) {
          return {
            content: '❌ Du har inte behörighet att rensa meddelanden',
            isPrivate: true
          };
        }

        const deleted = await this.prisma.message.deleteMany({
          where: {
            channelId: context.channelId
          }
        });

        // Notify clients to refresh
        if (this.io) {
          this.io.to(`channel:${context.channelId}`).emit('messages:cleared', {
            channelId: context.channelId,
            count: deleted.count
          });
        }

        return {
          content: `🧹 ${deleted.count} meddelanden raderades`,
          isPrivate: false
        };
      }
    });

    // Poll command
    this.registerCommand({
      name: 'poll',
      description: 'Skapa en enkel omröstning',
      usage: '/poll "Fråga" "Alternativ 1" "Alternativ 2" ...',
      execute: async (args) => {
        if (args.length < 3) {
          return {
            content: '❌ Ange minst en fråga och två alternativ',
            isPrivate: true
          };
        }

        const question = args[0];
        const options = args.slice(1);
        const emojis = [
          '1️⃣',
          '2️⃣',
          '3️⃣',
          '4️⃣',
          '5️⃣',
          '6️⃣',
          '7️⃣',
          '8️⃣',
          '9️⃣',
          '🔟'
        ];

        const optionList = options
          .slice(0, 10)
          .map((opt, i) => `${emojis[i]} ${opt}`)
          .join('\n');

        return {
          content: `📊 **Omröstning:** ${question}\n\n${optionList}\n\n_Reagera med emoji för att rösta!_`,
          isPrivate: false
        };
      }
    });

    // Remind command
    this.registerCommand({
      name: 'remind',
      description: 'Sätt en påminnelse',
      usage: '/remind <minuter> <meddelande>',
      execute: async (args, context) => {
        if (args.length < 2) {
          return {
            content: '❌ Ange antal minuter och ett meddelande',
            isPrivate: true
          };
        }

        const minutes = parseInt(args[0], 10);
        if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
          return {
            content: '❌ Ange 1-1440 minuter',
            isPrivate: true
          };
        }

        const message = args.slice(1).join(' ');

        // Schedule reminder (in-memory, will be lost on restart)
        setTimeout(
          async () => {
            await this.sendBotMessage(
              context.channelId,
              `⏰ **Påminnelse för** <@${context.userId}>:\n${message}`
            );
          },
          minutes * 60 * 1000
        );

        return {
          content: `✅ Påminnelse satt om ${minutes} minut(er)`,
          isPrivate: true
        };
      }
    });

    // Info command
    this.registerCommand({
      name: 'info',
      description: 'Visa information om kanalen',
      usage: '/info',
      execute: async (_, context) => {
        const channel = await this.prisma.channel.findUnique({
          where: { id: context.channelId },
          include: {
            _count: { select: { messages: true, members: true } }
          }
        });

        if (!channel) {
          return { content: '❌ Kanalen hittades inte', isPrivate: true };
        }

        return {
          content:
            `**#${channel.name}**\n` +
            `${channel.description ?? '_Ingen beskrivning_'}\n\n` +
            `📝 ${channel._count.messages} meddelanden\n` +
            `👥 ${channel._count.members} medlemmar\n` +
            `📅 Skapad: ${channel.createdAt.toLocaleDateString('sv-SE')}`,
          isPrivate: true
        };
      }
    });
  }

  registerCommand(command: SlashCommand) {
    this.commands.set(command.name, command);
  }

  async processMessage(
    content: string,
    context: CommandContext
  ): Promise<CommandResult | null> {
    // Check if it's a slash command
    if (!content.startsWith('/')) {
      return null;
    }

    const parts = this.parseCommand(content);
    if (parts.length === 0) {
      return null;
    }

    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    const command = this.commands.get(commandName);
    if (!command) {
      return {
        content: `❌ Okänt kommando: /${commandName}. Skriv /help för att se tillgängliga kommandon.`,
        isPrivate: true
      };
    }

    return command.execute(args, context);
  }

  // Parse command considering quoted strings
  private parseCommand(content: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    // Remove the leading /
    const text = content.slice(1);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts;
  }

  // Send a bot message
  private async sendBotMessage(
    channelId: string,
    content: string
  ): Promise<void> {
    const message = await this.prisma.message.create({
      data: {
        channelId,
        authorId: BOT_USER_ID,
        content
      }
    });

    if (this.io) {
      this.io.to(`channel:${channelId}`).emit('message:new', {
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

  getCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }
}
