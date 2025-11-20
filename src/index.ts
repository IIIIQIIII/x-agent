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
  try {
    // Load settings from .claude/settings.json
    const settings = await loadSettings();

    const systemPrompt = `You are an X.com (Twitter) automation agent with access to Chrome browser automation through MCP.

Your capabilities include:
- Navigating to X.com and logging in (if needed)
- Liking posts
- Commenting on posts
- Creating new posts
- Viewing and analyzing timelines
- Following/unfollowing users
- Searching for content

You should:
1. Always confirm actions with the user before executing them
2. Handle errors gracefully and report them clearly
3. Use Chrome MCP tools to interact with the browser
4. Wait for pages to load before interacting with elements
5. Be respectful and follow X.com's terms of service

When interacting with X.com:
- Use CSS selectors to find elements
- Wait for dynamic content to load
- Handle rate limits appropriately
- Verify actions completed successfully`;

    console.log('X.com Automation Agent initialized!');
    console.log('Starting interactive session...\n');

    // Example: Navigate to X.com
    const navigationQuery = query({
      prompt: 'Please navigate to https://x.com using Chrome and confirm when the page has loaded.',
      options: {
        ...settings,
        systemPrompt,
      },
    });

    console.log('Navigating to X.com...');

    for await (const message of navigationQuery) {
      if (message.type === 'assistant') {
        // Process assistant messages
        console.log('Assistant:', message.message);
      } else if (message.type === 'result') {
        if (message.subtype === 'success') {
          console.log('\nResult:', message.result);
        }
        console.log('Status:', message.is_error ? 'Error' : 'Success');
        console.log('Turns:', message.num_turns);
        console.log('Cost: $' + message.total_cost_usd.toFixed(4));
      }
    }

    console.log('\nAgent is ready! You can now modify this code to execute X.com actions.');
    console.log('\nExample usage:');
    console.log('  - Navigate to X.com (done above)');
    console.log('  - Like a post: modify prompt to include post URL');
    console.log('  - Comment: add comment text to prompt');
    console.log('  - Create post: add post content to prompt');
    console.log('\nSee README.md for more examples.');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
