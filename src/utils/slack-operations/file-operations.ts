import * as fs from 'fs/promises';
import { basename, join } from 'path';
import { BaseSlackClient, SlackClientDependency } from './base-client';
import { ChannelOperations } from './channel-operations';

export interface SlackFile {
  id: string;
  name: string;
  title: string;
  mimetype: string;
  filetype: string;
  size: number;
  user: string;
  created: number;
  url_private?: string;
  permalink?: string;
}

export interface UploadFileOptions {
  channel: string;
  filePath?: string | string[];
  content?: string;
  filename?: string;
  title?: string;
  initialComment?: string;
  blocks?: unknown[];
  snippetType?: string;
  threadTs?: string;
}

export class FileOperations extends BaseSlackClient {
  private channelOps: ChannelOperations;

  constructor(dependency: SlackClientDependency, channelOps?: ChannelOperations) {
    super(dependency);
    this.channelOps = channelOps ?? new ChannelOperations(dependency);
  }

  async listFiles(options?: {
    channel?: string;
    user?: string;
    count?: number;
    page?: number;
    types?: string;
  }): Promise<{ files: SlackFile[]; paging: { count: number; total: number; page: number; pages: number } }> {
    const params: Record<string, unknown> = {};
    if (options?.channel) {
      params.channel = await this.channelOps.resolveChannelId(options.channel);
    }
    if (options?.user) params.user = options.user;
    if (options?.count) params.count = options.count;
    if (options?.page) params.page = options.page;
    if (options?.types) params.types = options.types;

    const response = await this.client.files.list(params);
    return {
      files: (response as { files?: SlackFile[] }).files || [],
      paging: (response as { paging?: { count: number; total: number; page: number; pages: number } }).paging || { count: 0, total: 0, page: 1, pages: 1 },
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.client.files.delete({ file: fileId });
  }

  async getFileInfo(fileId: string): Promise<SlackFile> {
    const response = await this.client.files.info({ file: fileId });
    return (response as { file?: SlackFile }).file as SlackFile;
  }

  async downloadFile(fileId: string, outputDir: string): Promise<string> {
    const fileInfo = await this.getFileInfo(fileId);
    const url = fileInfo.url_private;
    if (!url) {
      throw new Error(`No download URL available for file ${fileId}`);
    }

    const token = (this.client as unknown as { token: string }).token;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const filename = fileInfo.name || fileId;
    const outputPath = join(outputDir, filename);
    await fs.writeFile(outputPath, buffer);
    return outputPath;
  }

  async uploadFile(options: UploadFileOptions): Promise<void> {
    const channelId = await this.channelOps.resolveChannelId(options.channel);

    const params: Record<string, unknown> = {
      channel_id: channelId,
    };

    if (options.filePath) {
      const filePaths = Array.isArray(options.filePath) ? options.filePath : [options.filePath];
      if (filePaths.length === 1) {
        params.file = filePaths[0];
        params.filename = options.filename || basename(filePaths[0]);
      } else {
        params.file_uploads = filePaths.map(fp => ({
          file: fp,
          filename: basename(fp),
        }));
      }
    } else if (options.content) {
      params.content = options.content;
      params.filename = options.filename;
    }

    if (options.title) params.title = options.title;
    if (options.initialComment) params.initial_comment = options.initialComment;
    if (options.blocks) params.blocks = options.blocks;
    if (options.snippetType) params.snippet_type = options.snippetType;
    if (options.threadTs) params.thread_ts = options.threadTs;

    await this.client.files.uploadV2(
      params as unknown as Parameters<typeof this.client.files.uploadV2>[0]
    );
  }
}
