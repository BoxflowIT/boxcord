// File Upload Routes
import type { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { prisma } from '../../../03-infrastructure/database/client.js';
import { FileService } from '../../../02-application/services/file.service.js';

const fileService = new FileService(prisma);

export async function fileRoutes(app: FastifyInstance) {
  // Register multipart plugin for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB
      files: 5 // Max 5 files per request
    }
  });

  // All routes require authentication
  app.addHook('onRequest', async (request) => {
    await app.authenticate(request);
  });

  // Upload general file (for workspace icons, etc.)
  app.post('/', async (request, reply) => {
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' }
      });
    }

    const buffer = await file.toBuffer();

    // Save to uploads directory with unique filename
    const fileUrl = await fileService.uploadGeneral({
      fileName: file.filename,
      fileType: file.mimetype,
      fileSize: buffer.length,
      buffer
    });

    return reply
      .status(201)
      .send({ success: true, data: { url: fileUrl, fileName: file.filename } });
  });

  // Upload file for channel message
  app.post<{ Params: { messageId: string } }>(
    '/messages/:messageId',
    async (request, reply) => {
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded' }
        });
      }

      const buffer = await file.toBuffer();

      const attachment = await fileService.uploadForMessage(
        request.params.messageId,
        {
          fileName: file.filename,
          fileType: file.mimetype,
          fileSize: buffer.length,
          buffer
        }
      );

      return reply.status(201).send({ success: true, data: attachment });
    }
  );

  // Upload file for DM
  app.post<{ Params: { messageId: string } }>(
    '/dm/:messageId',
    async (request, reply) => {
      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          success: false,
          error: { code: 'NO_FILE', message: 'No file uploaded' }
        });
      }

      const buffer = await file.toBuffer();

      const attachment = await fileService.uploadForDM(
        request.params.messageId,
        {
          fileName: file.filename,
          fileType: file.mimetype,
          fileSize: buffer.length,
          buffer
        }
      );

      return reply.status(201).send({ success: true, data: attachment });
    }
  );

  // Get attachment info
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const attachment = await fileService.getAttachment(request.params.id);

    if (!attachment) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Attachment not found' }
      });
    }

    return { success: true, data: attachment };
  });

  // Delete attachment
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    await fileService.deleteAttachment(request.params.id);
    return reply.status(204).send();
  });
}
