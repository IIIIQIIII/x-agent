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
  console.log('🚀 Starting X-Agent to explore Large Language Model topics!\n');

  const settings = await loadSettings();

  const systemPrompt = `You are an X.com (Twitter) automation agent with access to Chrome DevTools MCP for browser automation.

Your current mission: Explore large language model (LLM) topics on X.com and engage with the community.

Available Chrome DevTools MCP tools:
- navigate_page: Navigate to URLs
- click: Click on elements (buttons, links)
- fill: Fill input fields
- evaluate_script: Execute JavaScript in the page
- take_screenshot: Take screenshots for verification
- wait_for: Wait for elements to appear

Tasks:
1. Navigate to X.com
2. Search for "large language model" or "LLM" topics
3. Find at least 3 interesting posts about LLMs
4. Like each post (click the like button)
5. Leave thoughtful, relevant comments on each post

When commenting:
- Be authentic and insightful
- Add value to the conversation
- Keep comments concise (1-2 sentences)
- Be respectful and professional
- Focus on technical aspects, use cases, or interesting observations about LLMs

Important:
- Use wait_for to ensure elements are loaded before interacting
- Use evaluate_script to find elements with specific selectors
- Take screenshots to verify your actions
- Handle any login/authentication requirements if needed`;

  const prompt = `Please complete this mission:

1. Navigate to X.com and make sure you're on the homepage
2. Use the search feature to find posts about "large language models" or "LLM"
3. Browse the search results and identify at least 3 interesting posts about LLMs
4. For each of the 3 posts:
   a. Like the post
   b. Write and post a thoughtful comment relevant to the content
5. Report back with:
   - The posts you engaged with (titles or first few words)
   - What you commented on each
   - Confirmation that likes and comments were successfully posted

Please proceed step by step and let me know what you're doing at each stage.`;

  const queryResult = query({
    prompt,
    options: {
      ...settings,
      systemPrompt,
      maxTurns: 50, // Allow enough turns for complex interactions
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
    },
  });

  console.log('Agent is running...\n');
  console.log('═'.repeat(80));
  console.log('\n');

  for await (const message of queryResult) {
    if (message.type === 'assistant') {
      // Log assistant's thought process
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

  console.log('\n✨ X-Agent session completed!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
