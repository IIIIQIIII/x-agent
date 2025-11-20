import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { Options } from '@anthropic-ai/claude-agent-sdk';
import { XAgent } from './x-agent.js';

/**
 * Example usage of the X-Agent
 *
 * This file demonstrates different ways to use the X.com automation agent.
 * Uncomment the examples you want to try.
 */

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
  const settings = await loadSettings();
  const systemPrompt = `You are an X.com (Twitter) automation agent with access to Chrome browser automation through MCP.

Your capabilities include navigating X.com, liking posts, commenting, creating posts, following users, and more.

Always:
- Confirm actions with the user before executing them
- Handle errors gracefully
- Use Chrome MCP tools to interact with the browser
- Wait for pages to load before interacting with elements
- Follow X.com's terms of service`;

  const options: Options = {
    ...settings,
    systemPrompt,
  };

  const xAgent = new XAgent(options);

  console.log('X-Agent Examples\n');

  // Example 1: Navigate to X.com
  console.log('Example 1: Navigate to X.com');
  await xAgent.navigateToX();
  console.log('\n---\n');

  // Example 2: View timeline (uncomment to use)
  // console.log('Example 2: View timeline');
  // await xAgent.viewTimeline();
  // console.log('\n---\n');

  // Example 3: Like a post (uncomment and add real URL)
  // console.log('Example 3: Like a post');
  // await xAgent.likePost('https://x.com/username/status/1234567890');
  // console.log('\n---\n');

  // Example 4: Search for content (uncomment to use)
  // console.log('Example 4: Search');
  // await xAgent.search('AI agents', 'posts');
  // console.log('\n---\n');

  // Example 5: Custom action (uncomment to use)
  // console.log('Example 5: Custom action');
  // const result = await xAgent.customAction(
  //   'Navigate to X.com and tell me what the first post on my timeline is about'
  // );
  // console.log('Result:', result);
  // console.log('\n---\n');

  console.log('Examples completed!');
  console.log('Edit this file to try different actions.');
}

main().catch(console.error);
