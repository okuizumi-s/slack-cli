import { BaseSlackClient, SlackClientDependency } from './base-client';

export interface SlackCall {
  id: string;
  date_start: number;
  date_end?: number;
  title?: string;
  desktop_app_join_url?: string;
  join_url?: string;
}

export class CallsOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async getInfo(callId: string): Promise<SlackCall> {
    const response = await this.client.calls.info({ id: callId });
    return (response as { call?: SlackCall }).call as SlackCall;
  }
}
