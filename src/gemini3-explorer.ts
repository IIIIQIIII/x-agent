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

async function executeBatch(batchNumber: number, startPost: number, endPost: number): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Starting Batch ${batchNumber}: Posts ${startPost}-${endPost}`);
  console.log(`${'='.repeat(80)}\n`);

  const settings = await loadSettings();

  const systemPrompt = `You are an X.com (Twitter) automation agent with access to Chrome DevTools MCP for browser automation.

Your current mission: Search for "Gemini 3" posts on X.com and engage with the community.

Available Chrome DevTools MCP tools:
- navigate_page: Navigate to URLs
- click: Click on elements (buttons, links)
- fill: Fill input fields
- evaluate_script: Execute JavaScript in the page
- take_snapshot: Take text snapshot of the page
- take_screenshot: Take screenshots for verification
- wait_for: Wait for elements to appear

Task Summary:
You need to interact with exactly 5 posts about "Gemini 3" (posts ${startPost} to ${endPost} in the overall sequence).

For EACH of the 5 posts:
1. Like the post (click the like/heart button)
2. Write and post a thoughtful, relevant comment

When commenting on "Gemini 3" posts:
- Be authentic and insightful about Gemini 3 (blockchain, AI, or whatever context it appears in)
- Keep comments concise (1-2 sentences)
- Focus on technical aspects, use cases, or interesting observations
- Be respectful and add value to the conversation

Examples of good comments:
- "Gemini 3 looks promising! The improvements in scalability are particularly interesting."
- "Great insights on Gemini 3. How does this compare with other approaches in the space?"
- "Exciting to see Gemini 3 development progress. The community support has been amazing."
- "This Gemini 3 update addresses some key challenges. Looking forward to seeing real-world applications."
- "Impressive work on Gemini 3! The technical architecture seems well-designed."

Important:
- Complete ALL 5 interactions before finishing
- Track your progress (e.g., "Completed 1/5 posts")
- Skip any posts you've already interacted with in previous batches
- Use take_snapshot to verify page state
- Wait for elements to load before interacting
- Confirm each like and comment was successfully posted`;

  const prompt = `Please complete this mission for posts ${startPost} to ${endPost}:

1. Navigate to X.com (if not already there)
2. Search for "Gemini 3" using the search feature
3. Find and interact with exactly 5 unique posts about Gemini 3
4. For EACH of the 5 posts:
   a. Like the post
   b. Write and post a thoughtful, relevant comment
5. Keep track of your progress (report "Completed X/5 posts" after each interaction)

Report back with:
- The 5 posts you engaged with (post URLs or first few words)
- What comment you posted on each
- Confirmation that all 5 likes and comments were successfully posted

Please proceed step by step and track your progress clearly.`;

  const queryResult = query({
    prompt,
    options: {
      ...settings,
      systemPrompt,
      maxTurns: 100, // Allow enough turns for 5 posts
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
    },
  });

  console.log('Agent is running...\n');

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
      console.log('─'.repeat(80));
      console.log('\n');

      if (message.subtype === 'success') {
        console.log(`✅ Batch ${batchNumber} Complete!\n`);
        console.log('Summary:');
        console.log(message.result);
        console.log();
        console.log(`📊 Stats:`);
        console.log(`   - Turns: ${message.num_turns}`);
        console.log(`   - Cost: $${message.total_cost_usd.toFixed(4)}`);
        console.log(`   - Duration: ${(message.duration_ms / 1000).toFixed(2)}s`);
      } else {
        console.log(`❌ Batch ${batchNumber} encountered an error`);
        if ('errors' in message) {
          console.log('Errors:', message.errors.join(', '));
        }
        throw new Error(`Batch ${batchNumber} failed`);
      }

      console.log();
      console.log('─'.repeat(80));
    }
  }
}

async function main() {
  console.log('\n');
  console.log('🎯 GEMINI 3 EXPLORER - 15 Posts Mission');
  console.log('━'.repeat(80));
  console.log('Target: Like and comment on 15 posts about "Gemini 3"');
  console.log('Strategy: 3 batches of 5 posts each');
  console.log('━'.repeat(80));

  const totalBatches = 3;
  const postsPerBatch = 5;

  for (let batch = 1; batch <= totalBatches; batch++) {
    const startPost = (batch - 1) * postsPerBatch + 1;
    const endPost = batch * postsPerBatch;

    try {
      await executeBatch(batch, startPost, endPost);

      console.log(`\n✅ Batch ${batch}/${totalBatches} completed successfully!`);
      console.log(`📈 Progress: ${endPost}/15 posts completed (${((endPost/15)*100).toFixed(0)}%)\n`);

      if (batch < totalBatches) {
        console.log(`⏳ Preparing for next batch in 3 seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`\n❌ Error in Batch ${batch}:`, error);
      console.log('\n🛑 Stopping execution due to error.\n');
      process.exit(1);
    }
  }

  console.log('\n');
  console.log('🎉'.repeat(40));
  console.log('\n✨ MISSION ACCOMPLISHED! ✨');
  console.log('\n📊 Final Summary:');
  console.log('   - Total posts interacted with: 15');
  console.log('   - Batches completed: 3');
  console.log('   - Posts per batch: 5');
  console.log('\n🎉'.repeat(40));
  console.log('\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
