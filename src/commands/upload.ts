import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import { UploadOptions } from '../types/commands';
import { createSlackClient } from '../utils/client-factory';
import { wrapCommand } from '../utils/command-wrapper';
import { FileError } from '../utils/errors';
import { parseProfile } from '../utils/option-parsers';
import { resolvePostAt } from '../utils/schedule-utils';
import { createValidationHook, optionValidators } from '../utils/validators';

export function setupUploadCommand(): Command {
  const uploadCommand = new Command('upload')
    .description('Upload a file or snippet to a Slack channel or DM')
    .option('-c, --channel <channel>', 'Channel name or ID')
    .option('--user <username>', 'Upload to DM by username')
    .option('--email <email>', 'Upload to DM by email address')
    .option('-f, --file <file>', 'File path to upload')
    .option('--content <content>', 'Text content to upload as snippet')
    .option('--filename <filename>', 'Override filename')
    .option('--title <title>', 'File title')
    .option('-m, --message <message>', 'Initial comment with the file')
    .option('--blocks <blocks>', 'JSON array of Block Kit blocks (mutually exclusive with --message)')
    .option('--filetype <filetype>', 'Snippet type (e.g. python, javascript, csv)')
    .option('-t, --thread <thread>', 'Thread timestamp to upload as reply')
    .option('--at <time>', 'Schedule time (Unix timestamp in seconds or ISO 8601)')
    .option('--after <minutes>', 'Schedule upload after N minutes')
    .option('--as-bot', 'Upload as bot instead of user')
    .option('--profile <profile>', 'Use specific workspace profile')
    .hook(
      'preAction',
      createValidationHook([
        optionValidators.sendTarget,
        optionValidators.fileOrContent,
        optionValidators.uploadThreadTimestamp,
        optionValidators.scheduleTiming,
      ])
    )
    .action(
      wrapCommand(async (options: UploadOptions) => {
        // Validate --message and --blocks are mutually exclusive
        if (options.message && options.blocks) {
          throw new FileError('Cannot use both --message and --blocks. When --blocks is specified, --message is ignored by the Slack API.');
        }

        // Verify file exists if file path provided
        if (options.file) {
          try {
            await fs.access(options.file);
          } catch {
            throw new FileError(`File not found: ${options.file}`);
          }
        }

        const profile = parseProfile(options.profile);
        const asBot = options.asBot === true;
        const client = await createSlackClient(profile, 'auto', asBot);

        // Resolve target channel (same pattern as send command)
        let targetChannel: string;
        let targetLabel: string;
        if (options.user) {
          const userId = await client.resolveUserIdByName(options.user!);
          targetChannel = await client.openDmChannel(userId);
          targetLabel = `@${options.user.replace(/^@/, '')}`;
        } else if (options.email) {
          const user = await client.lookupUserByEmail(options.email!);
          targetChannel = await client.openDmChannel(user.id!);
          targetLabel = options.email;
        } else {
          targetChannel = options.channel!;
          targetLabel = `#${options.channel}`;
        }

        // Handle scheduled upload
        const postAt = resolvePostAt(options.at, options.after);
        if (postAt !== null) {
          const delayMs = postAt * 1000 - Date.now();
          if (delayMs > 0) {
            const delaySeconds = Math.ceil(delayMs / 1000);
            const postAtIso = new Date(postAt * 1000).toISOString();
            console.log(chalk.yellow(`⏳ Upload scheduled for ${postAtIso} (in ${delaySeconds}s)...`));
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }

        // Parse blocks if provided
        const blocks = options.blocks ? JSON.parse(options.blocks) : undefined;

        // Upload file
        await client.uploadFile({
          channel: targetChannel,
          filePath: options.file,
          content: options.content,
          title: options.title,
          initialComment: options.message,
          blocks,
          snippetType: options.filetype,
          threadTs: options.thread,
          filename: options.filename,
        });

        if (options.user || options.email) {
          console.log(chalk.green(`✓ File uploaded successfully to ${targetLabel}`));
        } else {
          console.log(chalk.green(`✓ File uploaded successfully to ${targetLabel}`));
        }
      })
    );

  return uploadCommand;
}
