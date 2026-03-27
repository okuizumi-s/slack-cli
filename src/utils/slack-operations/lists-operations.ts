import { BaseSlackClient, SlackClientDependency } from './base-client';

export interface SlackList {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

export class ListsOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async list(teamId?: string, limit = 100): Promise<SlackList[]> {
    const params: Record<string, unknown> = { limit };
    if (teamId) params.team_id = teamId;
    const response = await (this.client as unknown as { apiCall: (method: string, options: Record<string, unknown>) => Promise<Record<string, unknown>> })
      .apiCall('lists.list', params);
    return ((response.lists || []) as SlackList[]);
  }

  async create(title: string, description?: string): Promise<string> {
    const response = await (this.client as unknown as { apiCall: (method: string, options: Record<string, unknown>) => Promise<Record<string, unknown>> })
      .apiCall('lists.create', { title, description });
    return (response.list as { id: string })?.id || '';
  }

  async delete(listId: string): Promise<void> {
    await (this.client as unknown as { apiCall: (method: string, options: Record<string, unknown>) => Promise<unknown> })
      .apiCall('lists.delete', { list_id: listId });
  }
}
