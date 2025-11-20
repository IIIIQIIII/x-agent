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
  console.log('🚀 Starting X-Agent to explore Vision Language Model topics!\n');

  const settings = await loadSettings();

  const systemPrompt = `You are an X.com (Twitter) automation agent with access to Chrome DevTools MCP for browser automation.

Your current mission: Explore Vision Language Model (VLM) topics on X.com and engage with the community.

Available Chrome DevTools MCP tools:
- navigate_page: Navigate to URLs
- click: Click on elements (buttons, links)
- fill: Fill input fields
- evaluate_script: Execute JavaScript in the page
- take_screenshot: Take screenshots for verification
- take_snapshot: Get accessibility tree of the page
- wait_for: Wait for elements to appear
- press_key: Press keyboard keys

**Mission Goal: Find and engage with 10 posts about Vision Language Models**

Tasks:
1. Navigate to X.com
2. Search for "vision language model" or "VLM" or "multimodal AI" topics
3. Find 10 interesting posts about Vision Language Models
4. For EACH of the 10 posts:
   - Like the post (click the like button)
   - Write and post a thoughtful, relevant comment

When commenting:
- Be authentic and insightful about VLMs, multimodal AI, or computer vision
- Add value to the conversation
- Keep comments concise (1-2 sentences)
- Be respectful and professional
- Focus on technical aspects, use cases, or interesting observations about VLMs
- Vary your comments - don't repeat the same thing
- Examples of good comments:
  * "Multimodal understanding is evolving so fast! Excited to see VLMs handling both vision and language seamlessly."
  * "This VLM approach to image understanding looks promising. The attention mechanism seems key."
  * "Great insights on vision-language alignment! This could really improve image captioning accuracy."

Important:
- Use wait_for to ensure elements are loaded before interacting
- Use evaluate_script to interact with the page when click/fill doesn't work
- Take snapshots to understand the page structure
- Be persistent with comments - try different methods if one doesn't work
- Track your progress: keep count of how many posts you've liked and commented on
- Don't give up if commenting is difficult - try JavaScript injection if needed`;

  const prompt = `Please complete this mission to engage with 10 Vision Language Model posts:

**Step-by-step instructions:**

1. Navigate to X.com
2. Search for "vision language model" or related terms (VLM, multimodal AI, vision-language)
3. Browse the search results and identify 10 interesting posts about VLMs
4. For EACH of the 10 posts, do BOTH:
   a. Click the like button to like the post
   b. Click reply, write a thoughtful comment, and post it

5. Keep track of your progress and report:
   - Post number (1/10, 2/10, etc.)
   - What the post is about
   - Your comment
   - Whether like and comment were successful

**Important tips:**
- If commenting fails with the normal UI, use JavaScript to directly manipulate the DOM
- For commenting, you may need to:
  * Click the reply button
  * Find the contenteditable div
  * Insert text using JavaScript: document.querySelector('[contenteditable="true"]').textContent = "your comment"
  * Trigger input events
  * Click the Reply/Post button
- Be patient and try multiple approaches if something doesn't work
- Take snapshots frequently to understand the page structure

Please proceed systematically through all 10 posts. Don't stop until you've engaged with all 10!`;

  const queryResult = query({
    prompt,
    options: {
      ...settings,
      systemPrompt,
      maxTurns: 100, // Allow enough turns for 10 posts
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
    },
  });

  console.log('Agent is running...\n');
  console.log('═'.repeat(80));
  console.log('\n');

  let likeCount = 0;
  let commentCount = 0;

  for await (const message of queryResult) {
    if (message.type === 'assistant') {
      // Log assistant's thought process
      const content = message.message.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === 'text') {
            console.log('🤖 Agent:', block.text);
            console.log();

            // Track progress from agent's messages
            const text = block.text.toLowerCase();
            if (text.includes('liked') && text.includes('post')) {
              likeCount++;
            }
            if (text.includes('comment') && (text.includes('posted') || text.includes('successful'))) {
              commentCount++;
            }
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
        console.log(`   - Posts targeted: 10`);
        console.log(`   - Likes given: ~${likeCount}`);
        console.log(`   - Comments posted: ~${commentCount}`);
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

  console.log('\n✨ VLM exploration session completed!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
