import { BaseSlackClient, SlackClientDependency } from './base-client';

export interface Usergroup {
  id: string;
  name: string;
  handle: string;
  description: string;
  is_external: boolean;
  user_count: number;
}

export class UsergroupOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async list(includeDisabled = false): Promise<Usergroup[]> {
    const response = await this.client.usergroups.list({
      include_disabled: includeDisabled,
    });
    return (response as { usergroups?: Usergroup[] }).usergroups || [];
  }

  async listMembers(usergroupId: string): Promise<string[]> {
    const response = await this.client.usergroups.users.list({
      usergroup: usergroupId,
    });
    return (response as { users?: string[] }).users || [];
  }

  async create(name: string, handle: string, description?: string): Promise<Usergroup> {
    const params: Record<string, unknown> = { name, handle };
    if (description) params.description = description;
    const response = await this.client.usergroups.create(
      params as unknown as Parameters<typeof this.client.usergroups.create>[0]
    );
    return (response as { usergroup?: Usergroup }).usergroup as Usergroup;
  }

  async update(usergroupId: string, options: { name?: string; handle?: string; description?: string }): Promise<Usergroup> {
    const params: Record<string, unknown> = { usergroup: usergroupId };
    if (options.name) params.name = options.name;
    if (options.handle) params.handle = options.handle;
    if (options.description) params.description = options.description;
    const response = await this.client.usergroups.update(
      params as unknown as Parameters<typeof this.client.usergroups.update>[0]
    );
    return (response as { usergroup?: Usergroup }).usergroup as Usergroup;
  }

  async disable(usergroupId: string): Promise<void> {
    await this.client.usergroups.disable({ usergroup: usergroupId });
  }

  async enable(usergroupId: string): Promise<void> {
    await this.client.usergroups.enable({ usergroup: usergroupId });
  }

  async updateMembers(usergroupId: string, userIds: string[]): Promise<void> {
    await this.client.usergroups.users.update({
      usergroup: usergroupId,
      users: userIds.join(','),
    });
  }
}
