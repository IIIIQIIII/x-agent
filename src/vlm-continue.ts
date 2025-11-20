import { query } from '@anthropic-ai/claude-agent-sdk';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { Options } from '@anthropic-ai/claude-agent-sdk';

async function loadSettings(): Promise<Partial<Options>> {
  try {
    const settingsPath = resolve(process.cwd(), '.claude', 'settings.json');
    const settingsContent = await readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(settingsContent);
    return {
      mcpServers: settings.mcpServers || {},
      permissionMode: settings.permissions?.edits?.requireApproval === false ? 'acceptEdits' : 'default',
      allowedTools: settings.permissions?.tools?.allow || undefined,
    };
  } catch (error) {
    console.warn('Could not load .claude/settings.json, using defaults');
    return {};
  }
}

async function main() {
  console.log('🚀 Continuing VLM exploration - Posts 5-10!\n');

  const settings = await loadSettings();

  const systemPrompt = `You are an X.com automation agent continuing a Vision Language Model exploration mission.

**Context:** You've already completed 4/10 posts. Now you need to complete the remaining 6 posts (Posts 5-10).

Available Chrome DevTools MCP tools:
- navigate_page, click, fill, evaluate_script, take_snapshot, wait_for, press_key, take_screenshot

**Mission: Complete posts 5-10 with likes and comments**

When commenting on VLM posts:
- Be authentic and insightful
- Add technical value
- Keep comments concise (1-2 sentences)
- Vary your comments - use different perspectives
- Examples:
  * "Multimodal grounding in VLMs is advancing rapidly!"
  * "The vision-language alignment here looks solid."
  * "Exciting to see VLMs becoming more efficient!"

Tips for success:
- Use JavaScript to fill comments if normal fill doesn't work
- Verify each action with snapshots
- Be patient and persistent
- Track your progress (5/10, 6/10, etc.)`;

  const prompt = `Continue the VLM engagement mission! You've completed posts 1-4. Now complete posts 5-10.

**Your task:**
1. You're currently on X.com with VLM search results
2. Find and engage with 6 MORE posts (posts 5-10)
3. For EACH post:
   - Like it
   - Write and post a unique, thoughtful comment

**Approach:**
- Scroll down if needed to find more posts
- Keep track: Post 5/10, Post 6/10, etc.
- For each post, report:
  * Post number
  * Topic
  * Your comment
  * Success confirmation

**Important:**
- Use JavaScript if normal commenting fails
- Don't give up on any post - try multiple methods
- Complete ALL 6 remaining posts

Start with Post 5/10 now!`;

  const queryResult = query({
    prompt,
    options: {
      ...settings,
      systemPrompt,
      maxTurns: 80,
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
    },
  });

  console.log('Agent is running...\n');
  console.log('═'.repeat(80));
  console.log('\n');

  for await (const message of queryResult) {
    if (message.type === 'assistant') {
      const content = message.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') {
            console.log('🤖 Agent:', block.text);
            console.log();
          } else if (block.type === 'tool_use') {
            console.log(`🔧 Using tool: ${block.name}`);
          }
        }
      }
    } else if (message.type === 'result') {
      console.log('\n');
      console.log('═'.repeat(80));
      console.log('\n');

      if (message.subtype === 'success') {
        console.log('✅ Mission Complete!\n');
        console.log('Summary:');
        console.log(message.result);
        console.log();
        console.log(`📊 Stats:`);
        console.log(`   - Turns: ${message.num_turns}`);
        console.log(`   - Cost: $${message.total_cost_usd.toFixed(4)}`);
        console.log(`   - Duration: ${(message.duration_ms / 1000).toFixed(2)}s`);
      } else {
        console.log('❌ Mission encountered an error');
        if ('errors' in message) {
          console.log('Errors:', message.errors.join(', '));
        }
      }

      console.log();
      console.log('═'.repeat(80));
    }
  }

  console.log('\n✨ All 10 VLM posts completed!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
