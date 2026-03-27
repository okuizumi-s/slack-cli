import { BaseSlackClient, SlackClientDependency } from './base-client';

export interface RemoteFile {
  id: string;
  title: string;
  external_url: string;
  external_type: string;
}

export class RemoteFilesOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async list(channel?: string): Promise<RemoteFile[]> {
    const params: Record<string, unknown> = {};
    if (channel) params.channel = channel;
    const response = await this.client.files.remote.list(params);
    return (response as { files?: RemoteFile[] }).files || [];
  }

  async getInfo(fileId?: string, externalId?: string): Promise<RemoteFile> {
    const params: Record<string, unknown> = {};
    if (fileId) params.file = fileId;
    if (externalId) params.external_id = externalId;
    const response = await this.client.files.remote.info(
      params as unknown as Parameters<typeof this.client.files.remote.info>[0]
    );
    return (response as { file?: RemoteFile }).file as RemoteFile;
  }

  async share(fileId: string, channels: string[]): Promise<void> {
    await this.client.files.remote.share({
      file: fileId,
      channels: channels.join(','),
    });
  }
}
