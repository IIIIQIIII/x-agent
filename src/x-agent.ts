import { query, type Options } from '@anthropic-ai/claude-agent-sdk';

/**
 * XAgent - X.com (Twitter) Automation Agent
 *
 * This class provides high-level methods for automating common X.com actions
 * using the Claude Agent SDK and Chrome MCP for browser automation.
 */
export class XAgent {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  /**
   * Execute a query and return the final result text
   */
  private async executeQuery(prompt: string): Promise<string> {
    const queryResult = query({
      prompt,
      options: this.options,
    });

    let resultText = '';

    for await (const message of queryResult) {
      if (message.type === 'result') {
        if (!message.is_error && message.subtype === 'success') {
          resultText = message.result;
        } else if ('errors' in message) {
          throw new Error(`Agent execution failed: ${message.errors.join(', ')}`);
        }
      }
    }

    return resultText;
  }

  /**
   * Navigate to X.com homepage
   */
  async navigateToX(): Promise<void> {
    console.log('Navigating to X.com...');

    const response = await this.executeQuery(
      `Please navigate to https://x.com using the Chrome browser.
      Wait for the page to load completely and confirm when ready.`
    );

    console.log('Navigation result:', response);
  }

  /**
   * Like a post on X.com
   * @param postUrl - The URL of the post to like
   */
  async likePost(postUrl: string): Promise<void> {
    console.log(`Liking post: ${postUrl}`);

    const response = await this.executeQuery(
      `Please navigate to ${postUrl} and like the post.

      Steps:
      1. Navigate to the post URL
      2. Wait for the page to load
      3. Find the like button (usually has aria-label containing "Like")
      4. Click the like button if not already liked
      5. Confirm the action was successful

      Report back whether the post was successfully liked or if it was already liked.`
    );

    console.log('Like result:', response);
  }

  /**
   * Comment on a post
   * @param postUrl - The URL of the post to comment on
   * @param comment - The comment text to post
   */
  async commentOnPost(postUrl: string, comment: string): Promise<void> {
    console.log(`Commenting on post: ${postUrl}`);
    console.log(`Comment: ${comment}`);

    const response = await this.executeQuery(
      `Please navigate to ${postUrl} and post this comment: "${comment}"

      Steps:
      1. Navigate to the post URL
      2. Wait for the page to load
      3. Find the reply/comment text box
      4. Click on the text box to focus it
      5. Type the comment: ${comment}
      6. Find and click the reply/post button
      7. Wait for confirmation that the comment was posted
      8. Verify the comment appears in the thread

      Report back whether the comment was successfully posted.`
    );

    console.log('Comment result:', response);
  }

  /**
   * Create a new post on X.com
   * @param content - The content of the post
   */
  async createPost(content: string): Promise<void> {
    console.log(`Creating new post...`);
    console.log(`Content: ${content}`);

    const response = await this.executeQuery(
      `Please create a new post on X.com with this content: "${content}"

      Steps:
      1. Make sure you're on X.com (navigate to https://x.com if needed)
      2. Find the "What's happening?" or "Post" text box (usually at the top of the timeline)
      3. Click on the text box to focus it
      4. Type the post content: ${content}
      5. Find the "Post" button (usually blue button in the bottom right)
      6. Click the Post button
      7. Wait for confirmation that the post was published
      8. Verify the post appears in your timeline

      Report back whether the post was successfully created and provide the post URL if possible.`
    );

    console.log('Post creation result:', response);
  }

  /**
   * View and analyze the timeline
   */
  async viewTimeline(): Promise<void> {
    console.log('Viewing timeline...');

    const response = await this.executeQuery(
      `Please navigate to the X.com timeline and provide a summary of the latest posts.

      Steps:
      1. Navigate to https://x.com (home timeline)
      2. Wait for the timeline to load
      3. Scroll through the first 5-10 posts
      4. Summarize the content you see

      Provide a brief overview of what's on the timeline.`
    );

    console.log('Timeline summary:', response);
  }

  /**
   * Follow a user on X.com
   * @param username - The username to follow (without @)
   */
  async followUser(username: string): Promise<void> {
    console.log(`Following user: @${username}`);

    const response = await this.executeQuery(
      `Please follow the user @${username} on X.com.

      Steps:
      1. Navigate to https://x.com/${username}
      2. Wait for the profile page to load
      3. Find the Follow button
      4. Click the Follow button if not already following
      5. Confirm the action was successful

      Report back whether the user was successfully followed or if already following.`
    );

    console.log('Follow result:', response);
  }

  /**
   * Unfollow a user on X.com
   * @param username - The username to unfollow (without @)
   */
  async unfollowUser(username: string): Promise<void> {
    console.log(`Unfollowing user: @${username}`);

    const response = await this.executeQuery(
      `Please unfollow the user @${username} on X.com.

      Steps:
      1. Navigate to https://x.com/${username}
      2. Wait for the profile page to load
      3. Find the Following button
      4. Click it to unfollow
      5. Confirm the unfollow action

      Report back whether the user was successfully unfollowed.`
    );

    console.log('Unfollow result:', response);
  }

  /**
   * Repost (retweet) a post
   * @param postUrl - The URL of the post to repost
   */
  async repost(postUrl: string): Promise<void> {
    console.log(`Reposting: ${postUrl}`);

    const response = await this.executeQuery(
      `Please repost (retweet) the post at ${postUrl}.

      Steps:
      1. Navigate to the post URL
      2. Wait for the page to load
      3. Find the repost button (usually has an icon with two arrows)
      4. Click the repost button
      5. Select "Repost" from the menu (not "Quote")
      6. Confirm the action was successful

      Report back whether the post was successfully reposted.`
    );

    console.log('Repost result:', response);
  }

  /**
   * Search for posts or users
   * @param query - The search query
   * @param type - Search type: 'posts' or 'users'
   */
  async search(searchQuery: string, type: 'posts' | 'users' = 'posts'): Promise<void> {
    console.log(`Searching for ${type}: ${searchQuery}`);

    const response = await this.executeQuery(
      `Please search X.com for "${searchQuery}" in the ${type} section.

      Steps:
      1. Navigate to https://x.com/explore
      2. Find the search box
      3. Type the query: ${searchQuery}
      4. Press Enter to search
      5. Switch to the "${type}" tab if needed
      6. Review the search results
      7. Provide a summary of the top results

      Report back with a summary of what you found.`
    );

    console.log('Search results:', response);
  }

  /**
   * Custom action - execute any custom instruction
   * @param instruction - The instruction for the agent to execute
   */
  async customAction(instruction: string): Promise<string> {
    console.log(`Executing custom action: ${instruction}`);

    const response = await this.executeQuery(instruction);

    console.log('Custom action result:', response);
    return response;
  }
}
