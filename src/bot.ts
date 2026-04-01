import { App } from '@slack/bolt';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ProfileConfigManager } from './utils/profile-config';

const execAsync = promisify(exec);

// 許可されたユーザーのみBotを使用可能
const ALLOWED_USERS = new Set([
  'U044M82KS5S', // 奥泉聖矢
]);

function isAllowedUser(userId: string): boolean {
  return ALLOWED_USERS.has(userId);
}

async function main() {
  const configManager = new ProfileConfigManager();
  const config = await configManager.getConfig();

  if (!config?.appToken) {
    console.error('App token not configured. Run: slack-cli config set --app-token xapp-YOUR-TOKEN');
    process.exit(1);
  }
  if (!config?.botToken) {
    console.error('Bot token not configured. Run: slack-cli config set --bot-token xoxb-YOUR-TOKEN');
    process.exit(1);
  }

  const app = new App({
    token: config.botToken,
    appToken: config.appToken,
    socketMode: true,
  });

  // @メンション受信時の処理
  app.event('app_mention', async ({ event, say }) => {
    if (!isAllowedUser(event.user || '')) {
      console.log(`[Bot] 未許可ユーザーからのメンションを無視: ${event.user}`);
      return;
    }

    const text = event.text.replace(/<@[A-Z0-9]+>/g, '').trim();

    if (!text) {
      await say({
        text: 'メンションありがとうございます！何かお手伝いできることはありますか？',
        thread_ts: event.ts,
      });
      return;
    }

    console.log(`[Bot] メンション受信: "${text}" from ${event.user} in ${event.channel}`);

    // 処理中メッセージ
    await say({
      text: ':hourglass_flowing_sand: 処理中...',
      thread_ts: event.ts,
    });

    try {
      // Claude Code CLIを実行
      const { stdout, stderr } = await execAsync(
        `claude --print "${text.replace(/"/g, '\\"')}"`,
        {
          timeout: 300000, // 5分タイムアウト
          maxBuffer: 1024 * 1024, // 1MB
          env: { ...process.env },
        }
      );

      const result = stdout.trim() || stderr.trim() || '(出力なし)';

      // Slackメッセージの文字数制限（4000文字）に対応
      if (result.length > 3900) {
        const truncated = result.substring(0, 3900) + '\n...(省略)';
        await say({
          text: truncated,
          thread_ts: event.ts,
        });
      } else {
        await say({
          text: result,
          thread_ts: event.ts,
        });
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      // トークンやシークレットをマスク
      const safeMsg = errMsg.replace(/xox[a-z]-[^\s"']+/g, '****');
      console.error(`[Bot] エラー: ${safeMsg}`);
      await say({
        text: `:warning: エラーが発生しました: ${safeMsg.substring(0, 500)}`,
        thread_ts: event.ts,
      });
    }
  });

  // DM受信時の処理
  app.message(async ({ message, say }) => {
    const msg = message as unknown as Record<string, unknown>;
    // bot自身のメッセージは無視
    if (msg.bot_id) return;
    // subtypeがあるもの（編集・削除等）は無視
    if (msg.subtype) return;

    const text = (msg.text as string) || '';
    if (!text.trim()) return;

    const userId = (msg.user as string) || 'unknown';
    if (!isAllowedUser(userId)) {
      console.log(`[Bot] 未許可ユーザーからのDMを無視: ${userId}`);
      return;
    }

    const ts = msg.ts as string;
    console.log(`[Bot] DM受信: "${text}" from ${userId}`);

    await say({
      text: ':hourglass_flowing_sand: 処理中...',
      thread_ts: ts,
    });

    try {
      const { stdout, stderr } = await execAsync(
        `claude --print "${text.replace(/"/g, '\\"')}"`,
        {
          timeout: 300000,
          maxBuffer: 1024 * 1024,
          env: { ...process.env },
        }
      );

      const result = stdout.trim() || stderr.trim() || '(出力なし)';

      if (result.length > 3900) {
        await say({
          text: result.substring(0, 3900) + '\n...(省略)',
          thread_ts: ts,
        });
      } else {
        await say({
          text: result,
          thread_ts: ts,
        });
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const safeMsg = errMsg.replace(/xox[a-z]-[^\s"']+/g, '****');
      console.error(`[Bot] エラー: ${safeMsg}`);
      await say({
        text: `:warning: エラーが発生しました: ${safeMsg.substring(0, 500)}`,
        thread_ts: ts,
      });
    }
  });

  // 起動時に未読メンションをチェック
  await checkUnreadMentions();

  await app.start();
  console.log('[Bot] Socket Mode で起動しました');
}

async function checkUnreadMentions() {
  try {
    const { stdout } = await execAsync('slack-cli unread --format json', {
      timeout: 30000,
    });
    if (stdout.trim()) {
      console.log('[Bot] 未読メッセージを確認中...');
      console.log(stdout.trim());
    } else {
      console.log('[Bot] 未読メンションなし');
    }
  } catch {
    console.log('[Bot] 未読チェックをスキップ');
  }
}

main().catch((err) => {
  console.error('[Bot] 起動エラー:', err.message);
  process.exit(1);
});
