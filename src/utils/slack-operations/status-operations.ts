import { BaseSlackClient, SlackClientDependency } from './base-client';

export interface UserProfile {
  status_text: string;
  status_emoji: string;
  status_expiration: number;
  display_name?: string;
  real_name?: string;
  title?: string;
}

export class StatusOperations extends BaseSlackClient {
  constructor(dependency: SlackClientDependency) {
    super(dependency);
  }

  async get(userId?: string): Promise<UserProfile> {
    const params: Record<string, string> = {};
    if (userId) params.user = userId;
    const response = await this.client.users.profile.get(params);
    return (response as { profile?: UserProfile }).profile as UserProfile;
  }

  async set(statusText: string, statusEmoji?: string, expiration?: number): Promise<UserProfile> {
    const profile: Record<string, unknown> = {
      status_text: statusText,
    };
    if (statusEmoji) profile.status_emoji = statusEmoji;
    if (expiration) profile.status_expiration = expiration;

    const response = await this.client.users.profile.set({
      profile: profile as unknown as Record<string, unknown>,
    });
    return (response as { profile?: UserProfile }).profile as UserProfile;
  }

  async clear(): Promise<UserProfile> {
    return this.set('', '');
  }
}
