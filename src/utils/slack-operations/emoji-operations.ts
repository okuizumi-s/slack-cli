import { BaseSlackClient, SlackClientDependency } from './base-client';

export class EmojiOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async list(): Promise<Record<string, string>> {
    const response = await this.client.emoji.list();
    return (response as { emoji?: Record<string, string> }).emoji || {};
  }
}
