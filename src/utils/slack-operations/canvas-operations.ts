import type { CanvasFile, CanvasSection } from '../../types/slack';
import { BaseSlackClient, SlackClientDependency } from './base-client';
import { ChannelOperations } from './channel-operations';

export class CanvasOperations extends BaseSlackClient {
  private channelOps: ChannelOperations;

  constructor(dependency: SlackClientDependency, channelOps?: ChannelOperations) {
    super(dependency);
    this.channelOps = channelOps ?? new ChannelOperations(dependency);
  }

  async readCanvas(canvasId: string): Promise<CanvasSection[]> {
    const response = await this.client.canvases.sections.lookup({
      canvas_id: canvasId,
      criteria: { section_types: ['any_header'] },
    });
    return (response.sections || []) as CanvasSection[];
  }

  async listCanvases(channel: string): Promise<CanvasFile[]> {
    const channelId = await this.channelOps.resolveChannelId(channel);
    const response = await this.client.files.list({
      channel: channelId,
      types: 'spaces',
    });
    return (response.files || []) as CanvasFile[];
  }

  async createCanvas(title: string, markdown?: string, channelId?: string): Promise<string> {
    const params: Record<string, unknown> = { title };
    if (markdown) {
      params.document_content = { type: 'markdown', markdown };
    }
    const response = await this.client.canvases.create(
      params as unknown as Parameters<typeof this.client.canvases.create>[0]
    );
    const canvasId = (response as { canvas_id?: string }).canvas_id || '';

    // Share to channel if specified
    if (channelId) {
      const resolved = await this.channelOps.resolveChannelId(channelId);
      await this.client.conversations.canvases.create({
        channel_id: resolved,
        canvas_id: canvasId,
      } as unknown as Parameters<typeof this.client.conversations.canvases.create>[0]);
    }

    return canvasId;
  }

  async editCanvas(canvasId: string, changes: Array<{
    operation: 'insert_at_end' | 'insert_at_start' | 'replace';
    document_content: { type: 'markdown'; markdown: string };
    section_id?: string;
  }>): Promise<void> {
    await this.client.canvases.edit({
      canvas_id: canvasId,
      changes: changes as unknown as Parameters<typeof this.client.canvases.edit>[0]['changes'],
    });
  }

  async deleteCanvas(canvasId: string): Promise<void> {
    await this.client.canvases.delete({ canvas_id: canvasId });
  }
}
