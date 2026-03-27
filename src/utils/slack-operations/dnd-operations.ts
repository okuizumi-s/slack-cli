import { BaseSlackClient, SlackClientDependency } from './base-client';

export interface DndStatus {
  dnd_enabled: boolean;
  next_dnd_start_ts: number;
  next_dnd_end_ts: number;
  snooze_enabled?: boolean;
  snooze_endtime?: number;
  snooze_remaining?: number;
}

export class DndOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async getInfo(userId?: string): Promise<DndStatus> {
    const params: Record<string, string> = {};
    if (userId) params.user = userId;
    const response = await this.client.dnd.info(params);
    return response as unknown as DndStatus;
  }

  async setSnooze(numMinutes: number): Promise<DndStatus> {
    const response = await this.client.dnd.setSnooze({
      num_minutes: numMinutes,
    });
    return response as unknown as DndStatus;
  }

  async endSnooze(): Promise<DndStatus> {
    const response = await this.client.dnd.endSnooze();
    return response as unknown as DndStatus;
  }
}
