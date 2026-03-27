import {
  ChatPostEphemeralResponse,
  ChatPostMessageResponse,
  ChatScheduleMessageResponse,
  ChatUpdateResponse,
} from '@slack/web-api';
import type {
  CanvasFile,
  CanvasSection,
  Channel,
  ChannelDetail,
  ChannelMembersOptions,
  ChannelMembersResult,
  ChannelUnreadResult,
  HistoryOptions,
  HistoryResult,
  ListChannelsOptions,
  PinnedItem,
  Reminder,
  ScheduledMessage,
  SearchMessagesOptions,
  SearchResult,
  SlackUser,
  StarListResult,
  UserPresence,
} from '../types/slack';
import { createSlackClientContext } from './slack-operations/base-client';
import { CallsOperations } from './slack-operations/calls-operations';
import type { SlackCall } from './slack-operations/calls-operations';
import { CanvasOperations } from './slack-operations/canvas-operations';
import { ChannelOperations } from './slack-operations/channel-operations';
import { DndOperations } from './slack-operations/dnd-operations';
import type { DndStatus } from './slack-operations/dnd-operations';
import { EmojiOperations } from './slack-operations/emoji-operations';
import type { SlackFile, UploadFileOptions } from './slack-operations/file-operations';
import { FileOperations } from './slack-operations/file-operations';
import { LinksOperations } from './slack-operations/links-operations';
import { ListsOperations } from './slack-operations/lists-operations';
import { RemoteFilesOperations } from './slack-operations/remote-files-operations';
import type { RemoteFile } from './slack-operations/remote-files-operations';
import { MessageOperations } from './slack-operations/message-operations';
import { PinOperations } from './slack-operations/pin-operations';
import { ReactionOperations } from './slack-operations/reaction-operations';
import { ReminderOperations } from './slack-operations/reminder-operations';
import { SearchOperations } from './slack-operations/search-operations';
import { StarOperations } from './slack-operations/star-operations';
import { StatusOperations } from './slack-operations/status-operations';
import type { UserProfile } from './slack-operations/status-operations';
import { UsergroupOperations } from './slack-operations/usergroup-operations';
import type { Usergroup } from './slack-operations/usergroup-operations';
import { UserOperations } from './slack-operations/user-operations';

export class SlackApiClient {
  private channelOps: ChannelOperations;
  private messageOps: MessageOperations;
  private fileOps: FileOperations;
  private reactionOps: ReactionOperations;
  private pinOps: PinOperations;
  private userOps: UserOperations;
  private searchOps: SearchOperations;
  private reminderOps: ReminderOperations;
  private starOps: StarOperations;
  private canvasOps: CanvasOperations;
  private dndOps: DndOperations;
  private emojiOps: EmojiOperations;
  private usergroupOps: UsergroupOperations;
  private statusOps: StatusOperations;
  private callsOps: CallsOperations;
  private listsOps: ListsOperations;
  private remoteFilesOps: RemoteFilesOperations;
  private linksOps: LinksOperations;

  constructor(token: string) {
    const sharedContext = createSlackClientContext(token);
    this.channelOps = new ChannelOperations(sharedContext);
    this.messageOps = new MessageOperations(sharedContext, this.channelOps);
    this.fileOps = new FileOperations(sharedContext, this.channelOps);
    this.reactionOps = new ReactionOperations(sharedContext, this.channelOps);
    this.pinOps = new PinOperations(sharedContext, this.channelOps);
    this.userOps = new UserOperations(sharedContext);
    this.searchOps = new SearchOperations(sharedContext);
    this.reminderOps = new ReminderOperations(sharedContext);
    this.starOps = new StarOperations(sharedContext);
    this.canvasOps = new CanvasOperations(sharedContext, this.channelOps);
    this.dndOps = new DndOperations(sharedContext);
    this.emojiOps = new EmojiOperations(sharedContext);
    this.usergroupOps = new UsergroupOperations(sharedContext);
    this.statusOps = new StatusOperations(sharedContext);
    this.callsOps = new CallsOperations(sharedContext);
    this.listsOps = new ListsOperations(sharedContext);
    this.remoteFilesOps = new RemoteFilesOperations(sharedContext);
    this.linksOps = new LinksOperations(sharedContext);
  }

  async sendMessage(
    channel: string,
    text: string,
    thread_ts?: string
  ): Promise<ChatPostMessageResponse> {
    return this.messageOps.sendMessage(channel, text, thread_ts);
  }

  async sendEphemeralMessage(
    channel: string,
    user: string,
    text: string,
    thread_ts?: string
  ): Promise<ChatPostEphemeralResponse> {
    return this.messageOps.sendEphemeralMessage(channel, user, text, thread_ts);
  }

  async scheduleMessage(
    channel: string,
    text: string,
    post_at: number,
    thread_ts?: string
  ): Promise<ChatScheduleMessageResponse> {
    return this.messageOps.scheduleMessage(channel, text, post_at, thread_ts);
  }

  async updateMessage(channel: string, ts: string, text: string): Promise<ChatUpdateResponse> {
    return this.messageOps.updateMessage(channel, ts, text);
  }

  async deleteMessage(channel: string, ts: string): Promise<void> {
    return this.messageOps.deleteMessage(channel, ts);
  }

  async listScheduledMessages(channel?: string, limit = 50): Promise<ScheduledMessage[]> {
    return this.messageOps.listScheduledMessages(channel, limit);
  }

  async cancelScheduledMessage(channel: string, scheduledMessageId: string): Promise<void> {
    return this.messageOps.cancelScheduledMessage(channel, scheduledMessageId);
  }

  async listChannels(options: ListChannelsOptions): Promise<Channel[]> {
    return this.channelOps.listChannels(options);
  }

  async getChannelDetail(channelNameOrId: string): Promise<ChannelDetail> {
    return this.channelOps.getChannelDetail(channelNameOrId);
  }

  async setTopic(channelNameOrId: string, topic: string): Promise<void> {
    return this.channelOps.setTopic(channelNameOrId, topic);
  }

  async setPurpose(channelNameOrId: string, purpose: string): Promise<void> {
    return this.channelOps.setPurpose(channelNameOrId, purpose);
  }

  async getHistory(channel: string, options: HistoryOptions): Promise<HistoryResult> {
    return this.messageOps.getHistory(channel, options);
  }

  async getThreadHistory(channel: string, threadTs: string): Promise<HistoryResult> {
    return this.messageOps.getThreadHistory(channel, threadTs);
  }

  async listUnreadChannels(): Promise<Channel[]> {
    try {
      const channels = await this.searchOps.listUnreadChannels();
      return await this.channelOps.enrichUnreadChannels(channels);
    } catch {
      return this.channelOps.listUnreadChannels();
    }
  }

  async getChannelUnread(channelNameOrId: string): Promise<ChannelUnreadResult> {
    return this.messageOps.getChannelUnread(channelNameOrId);
  }

  async markAsRead(channelId: string): Promise<void> {
    return this.messageOps.markAsRead(channelId);
  }

  async getPermalink(channel: string, messageTs: string): Promise<string | null> {
    return this.messageOps.getPermalink(channel, messageTs);
  }

  async getPermalinks(channel: string, messageTimestamps: string[]): Promise<Map<string, string>> {
    return this.messageOps.getPermalinks(channel, messageTimestamps);
  }

  async uploadFile(options: UploadFileOptions): Promise<void> {
    return this.fileOps.uploadFile(options);
  }

  async listFiles(options?: {
    channel?: string;
    user?: string;
    count?: number;
    page?: number;
    types?: string;
  }): Promise<{ files: SlackFile[]; paging: { count: number; total: number; page: number; pages: number } }> {
    return this.fileOps.listFiles(options);
  }

  async deleteFile(fileId: string): Promise<void> {
    return this.fileOps.deleteFile(fileId);
  }

  async downloadFile(fileId: string, outputDir: string): Promise<string> {
    return this.fileOps.downloadFile(fileId, outputDir);
  }

  async addReaction(channel: string, timestamp: string, emoji: string): Promise<void> {
    return this.reactionOps.addReaction(channel, timestamp, emoji);
  }

  async removeReaction(channel: string, timestamp: string, emoji: string): Promise<void> {
    return this.reactionOps.removeReaction(channel, timestamp, emoji);
  }

  async listReactions(channel: string, timestamp: string): Promise<Array<{ name: string; count: number; users: string[] }>> {
    return this.reactionOps.listReactions(channel, timestamp);
  }

  async addPin(channel: string, timestamp: string): Promise<void> {
    return this.pinOps.addPin(channel, timestamp);
  }

  async removePin(channel: string, timestamp: string): Promise<void> {
    return this.pinOps.removePin(channel, timestamp);
  }

  async listPins(channel: string): Promise<PinnedItem[]> {
    return this.pinOps.listPins(channel);
  }

  async listUsers(limit?: number): Promise<SlackUser[]> {
    return this.userOps.listUsers(limit);
  }

  async getUserInfo(userId: string): Promise<SlackUser> {
    return this.userOps.getUserInfo(userId);
  }

  async lookupUserByEmail(email: string): Promise<SlackUser> {
    return this.userOps.lookupByEmail(email);
  }

  async openDmChannel(userId: string): Promise<string> {
    return this.userOps.openDmChannel(userId);
  }

  async getUserPresence(userId: string): Promise<UserPresence> {
    return this.userOps.getPresence(userId);
  }

  async resolveUserIdByName(username: string): Promise<string> {
    return this.userOps.resolveUserIdByName(username);
  }

  async searchMessages(query: string, options?: SearchMessagesOptions): Promise<SearchResult> {
    return this.searchOps.searchMessages(query, options);
  }

  async joinChannel(channelNameOrId: string): Promise<void> {
    return this.channelOps.joinChannel(channelNameOrId);
  }

  async leaveChannel(channelNameOrId: string): Promise<void> {
    return this.channelOps.leaveChannel(channelNameOrId);
  }

  async inviteToChannel(
    channelNameOrId: string,
    userIds: string[],
    force?: boolean
  ): Promise<void> {
    return this.channelOps.inviteToChannel(channelNameOrId, userIds, force);
  }

  async getChannelMembers(
    channelNameOrId: string,
    options?: ChannelMembersOptions
  ): Promise<ChannelMembersResult> {
    return this.channelOps.getChannelMembers(channelNameOrId, options);
  }

  async addReminder(text: string, time: number): Promise<Reminder> {
    return this.reminderOps.addReminder(text, time);
  }

  async listReminders(): Promise<Reminder[]> {
    return this.reminderOps.listReminders();
  }

  async deleteReminder(reminderId: string): Promise<void> {
    return this.reminderOps.deleteReminder(reminderId);
  }

  async completeReminder(reminderId: string): Promise<void> {
    return this.reminderOps.completeReminder(reminderId);
  }

  async addStar(channel: string, timestamp: string): Promise<void> {
    return this.starOps.addStar(channel, timestamp);
  }

  async listStars(count?: number): Promise<StarListResult> {
    return this.starOps.listStars(count);
  }

  async removeStar(channel: string, timestamp: string): Promise<void> {
    return this.starOps.removeStar(channel, timestamp);
  }

  async readCanvas(canvasId: string): Promise<CanvasSection[]> {
    return this.canvasOps.readCanvas(canvasId);
  }

  async listCanvases(channel: string): Promise<CanvasFile[]> {
    return this.canvasOps.listCanvases(channel);
  }

  async createCanvas(title: string, markdown?: string, channelId?: string): Promise<string> {
    return this.canvasOps.createCanvas(title, markdown, channelId);
  }

  async editCanvas(canvasId: string, changes: Array<{
    operation: 'insert_at_end' | 'insert_at_start' | 'replace';
    document_content: { type: 'markdown'; markdown: string };
    section_id?: string;
  }>): Promise<void> {
    return this.canvasOps.editCanvas(canvasId, changes);
  }

  async deleteCanvas(canvasId: string): Promise<void> {
    return this.canvasOps.deleteCanvas(canvasId);
  }

  // DND operations
  async getDndInfo(userId?: string): Promise<DndStatus> {
    return this.dndOps.getInfo(userId);
  }

  async setSnooze(numMinutes: number): Promise<DndStatus> {
    return this.dndOps.setSnooze(numMinutes);
  }

  async endSnooze(): Promise<DndStatus> {
    return this.dndOps.endSnooze();
  }

  // Emoji operations
  async listEmoji(): Promise<Record<string, string>> {
    return this.emojiOps.list();
  }

  // Usergroup operations
  async listUsergroups(includeDisabled?: boolean): Promise<Usergroup[]> {
    return this.usergroupOps.list(includeDisabled);
  }

  async listUsergroupMembers(usergroupId: string): Promise<string[]> {
    return this.usergroupOps.listMembers(usergroupId);
  }

  async createUsergroup(name: string, handle: string, description?: string): Promise<Usergroup> {
    return this.usergroupOps.create(name, handle, description);
  }

  async updateUsergroup(usergroupId: string, options: { name?: string; handle?: string; description?: string }): Promise<Usergroup> {
    return this.usergroupOps.update(usergroupId, options);
  }

  async disableUsergroup(usergroupId: string): Promise<void> {
    return this.usergroupOps.disable(usergroupId);
  }

  async enableUsergroup(usergroupId: string): Promise<void> {
    return this.usergroupOps.enable(usergroupId);
  }

  async updateUsergroupMembers(usergroupId: string, userIds: string[]): Promise<void> {
    return this.usergroupOps.updateMembers(usergroupId, userIds);
  }

  // Status operations
  async getStatus(userId?: string): Promise<UserProfile> {
    return this.statusOps.get(userId);
  }

  async setStatus(statusText: string, statusEmoji?: string, expiration?: number): Promise<UserProfile> {
    return this.statusOps.set(statusText, statusEmoji, expiration);
  }

  async clearStatus(): Promise<UserProfile> {
    return this.statusOps.clear();
  }

  // Calls operations
  async getCallInfo(callId: string): Promise<SlackCall> {
    return this.callsOps.getInfo(callId);
  }

  // Lists operations
  async listLists(teamId?: string): Promise<Array<{ id: string; title: string; description?: string }>> {
    return this.listsOps.list(teamId);
  }

  async createList(title: string, description?: string): Promise<string> {
    return this.listsOps.create(title, description);
  }

  async deleteList(listId: string): Promise<void> {
    return this.listsOps.delete(listId);
  }

  // Remote files operations
  async listRemoteFiles(channel?: string): Promise<RemoteFile[]> {
    return this.remoteFilesOps.list(channel);
  }

  async getRemoteFileInfo(fileId?: string, externalId?: string): Promise<RemoteFile> {
    return this.remoteFilesOps.getInfo(fileId, externalId);
  }

  async shareRemoteFile(fileId: string, channels: string[]): Promise<void> {
    return this.remoteFilesOps.share(fileId, channels);
  }

  // Search files
  async searchFiles(query: string, options?: SearchMessagesOptions): Promise<{
    files: Array<{ id: string; name: string; title: string; filetype: string; user: string; permalink: string }>;
    totalCount: number;
    page: number;
    pageCount: number;
  }> {
    return this.searchOps.searchFiles(query, options);
  }

  // Links operations
  async unfurlLink(channel: string, ts: string, unfurls: Record<string, unknown>): Promise<void> {
    return this.linksOps.unfurl(channel, ts, unfurls);
  }
}

export const slackApiClient = {
  listChannels: async (token: string, options: ListChannelsOptions): Promise<Channel[]> => {
    const client = new SlackApiClient(token);
    return client.listChannels(options);
  },
};
