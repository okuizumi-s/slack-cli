import { BaseSlackClient, SlackClientDependency } from './base-client';

export class LinksOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async unfurl(channel: string, ts: string, unfurls: Record<string, unknown>): Promise<void> {
    await this.client.chat.unfurl({
      channel,
      ts,
      unfurls,
    } as unknown as Parameters<typeof this.client.chat.unfurl>[0]);
  }
}
