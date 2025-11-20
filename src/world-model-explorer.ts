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
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
    };
  } catch (error) {
    console.warn('Could not load .claude/settings.json, using defaults');
    return {};
  }
}

async function main() {
  console.log('🚀 Starting X-Agent to explore World Model topics!\n');

  const settings = await loadSettings();

  const systemPrompt = `You are an X.com (Twitter) automation agent with access to Chrome DevTools MCP for browser automation.

Your current mission: Explore world model (AI world models, generative world models, video generation, video diffusion) topics on X.com and engage with the community.

Available Chrome DevTools MCP tools:
- navigate_page: Navigate to URLs
- click: Click on elements (buttons, links, like buttons, comment boxes)
- fill: Fill input fields
- evaluate_script: Execute JavaScript in the page
- take_screenshot: Take screenshots for verification
- take_snapshot: Get accessibility tree and page structure
- wait_for: Wait for elements to appear
- press_key: Press keyboard keys

Task Summary (30 total actions):
- Like 10 posts about world models
- Comment on 10 posts about world models
- Follow 10 accounts that post about world models

When engaging:
1. LIKES: Click the heart/like button on posts
2. COMMENTS: Write thoughtful, technical comments (1-2 sentences) about:
   - Video generation and diffusion models
   - World model architectures
   - Generative models for video
   - AI simulation and world understanding
3. FOLLOWS: Follow users who are actively discussing world models

Comment Examples:
- "Impressive approach to modeling temporal dynamics! The attention mechanism design shows promise for scaling."
- "Video diffusion models are fascinating. How does this compare with other state-of-the-art approaches?"
- "Great insights on world model training. The generalization to unseen scenarios is particularly interesting."

Important:
- Use wait_for to ensure elements are loaded before interacting
- Use evaluate_script to click elements if normal clicking fails
- Take screenshots to verify successful actions
- Track progress: count likes, comments, and follows as you complete them
- Be patient with page loading (X.com can be slow)
- If an action fails, retry with alternative approach`;

  const prompt = `Please complete this comprehensive mission on X.com:

MISSION OBJECTIVE: Engage with 10 World Model posts by liking, commenting, and following 10 related accounts.

DETAILED STEPS:

PHASE 1 - SEARCH AND BROWSE (5-10 minutes):
1. Navigate to X.com homepage
2. Use search to find posts about: "world model" OR "video generation" OR "video diffusion" OR "generative world model"
3. Browse through search results to find engaging posts
4. Select at least 10 posts about world models

PHASE 2 - ENGAGE WITH POSTS (Like + Comment) (15-20 minutes):
For each of the 10 posts you find:
1. Click the LIKE button (heart icon)
2. Click REPLY or COMMENT button
3. Write a thoughtful, technical comment (1-2 sentences) relevant to world models/video generation
4. Click POST/SUBMIT to publish the comment
5. Verify the like and comment were successful (check for confirmation)

PHASE 3 - FOLLOW ACCOUNTS (5-10 minutes):
1. For each post you engaged with, identify the author
2. Click on their profile
3. Click the FOLLOW button
4. Move to next author and repeat until 10 accounts are followed

SUCCESS CRITERIA:
- ✅ 10 posts liked
- ✅ 10 comments posted on different posts
- ✅ 10 accounts followed

For each completed action, report:
- Post topic/preview
- Whether like was successful
- Comment text posted (if applicable)
- Account followed (if applicable)

Please proceed systematically and report progress as you complete each action. Be patient with page loading and element interactions.`;

  const queryResult = query({
    prompt,
    options: {
      ...settings,
      systemPrompt,
      maxTurns: 100, // Allow enough turns for 30 interactions
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
    },
  });

  console.log('Agent is running...\n');
  console.log('═'.repeat(80));
  console.log('\n');

  let likeCount = 0;
  let commentCount = 0;
  let followCount = 0;

  for await (const message of queryResult) {
    if (message.type === 'assistant') {
      // Log assistant's thought process
      const content = message.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') {
            console.log('🤖 Agent:', block.text);
            console.log();

            // Track progress from agent output
            if (block.text.toLowerCase().includes('like')) likeCount++;
            if (block.text.toLowerCase().includes('comment')) commentCount++;
            if (block.text.toLowerCase().includes('follow')) followCount++;
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

  console.log('\n✨ X-Agent World Model exploration completed!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
