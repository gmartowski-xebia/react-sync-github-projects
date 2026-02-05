// src/utils/githubProjectTasks.ts
// Utility for interacting with GitHub Projects v2 tasks using Octokit (REST & GraphQL)
// Requires: npm install @octokit/core @octokit/graphql
// Usage: Set GTH_TOKEN in your environment variables (see below)

import { Octokit } from '@octokit/core';
import { graphql } from '@octokit/graphql';

// --- Types ---
export type UpdateTaskOptions = {
  projectId: string;
  itemId: string;
  statusFieldId: string;
  newStatus: string;
  description?: string;
  comment?: string;
};

export type Task = {
  id: string;
  title: string;
  status: string;
  description?: string;
};

// --- Environment variable check ---
const GTH_TOKEN = process.env.GTH_TOKEN;
if (!GTH_TOKEN) {
  throw new Error('GTH_TOKEN is not set. Please set it in your environment variables.');
}

const octokit = new Octokit({ auth: GTH_TOKEN });
const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${GTH_TOKEN}` } });

// --- Fetch a task from a GitHub Project by item ID ---
export async function fetchTaskById(projectId: string, itemId: string): Promise<Task> {
  // GraphQL query to get project item details
  const query = `
    query($projectId: ID!, $itemId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          item(id: $itemId) {
            id
            fieldValues(first: 20) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field {
                    id
                    name
                  }
                }
              }
            }
            content {
              ... on Issue {
                title
                body
              }
              ... on PullRequest {
                title
                body
              }
            }
          }
        }
      }
    }
  `;
  const result = await graphqlWithAuth(query, { projectId, itemId }) as any;
  const item = result.node.item;
  const statusField = item.fieldValues.nodes.find((n: any) => n.field?.name === 'Status');
  return {
    id: item.id,
    title: item.content?.title || '',
    status: statusField?.name || '',
    description: item.content?.body || '',
  };
}

// --- Update the status field of a task ---
export async function updateTaskStatus({
  projectId,
  itemId,
  statusFieldId,
  newStatus,
  description,
  comment,
}: UpdateTaskOptions): Promise<void> {
  // 1. Update status field
  await graphqlWithAuth(
    `mutation($input: UpdateProjectV2ItemFieldValueInput!) {
      updateProjectV2ItemFieldValue(input: $input) {
        projectV2Item {
          id
        }
      }
    }`,
    {
      input: {
        projectId,
        itemId,
        fieldId: statusFieldId,
        value: { singleSelectOptionId: newStatus },
      },
    }
  );

  // 2. Optionally update description (if provided)
  if (description) {
    await octokit.request('PATCH /repos/{owner}/{repo}/issues/{issue_number}', {
      owner: '<owner>', // TODO: Replace with your repo owner
      repo: '<repo>',   // TODO: Replace with your repo name
      issue_number: parseInt(itemId, 10), // Only if item is an Issue
      body: description,
    });
  }

  // 3. Optionally add a comment (if provided)
  if (comment) {
    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner: '<owner>', // TODO: Replace with your repo owner
      repo: '<repo>',   // TODO: Replace with your repo name
      issue_number: parseInt(itemId, 10), // Only if item is an Issue
      body: comment,
    });
  }
}

// --- Create a Pull Request and update its title/description ---
export type CreatePullRequestOptions = {
  owner: string;
  repo: string;
  head: string; // nazwa brancha z featurem
  base: string; // np. 'main'
  title: string;
  body?: string;
  draft?: boolean;
};

/**
 * Tworzy Pull Request na GitHubie i ustawia tytuł oraz opis.
 * Zwraca numer PR i adres URL.
 */
export async function createPullRequest({
  owner,
  repo,
  head,
  base,
  title,
  body,
  draft = false,
}: CreatePullRequestOptions): Promise<{ number: number; url: string }> {
  try {
    const response = await octokit.request('POST /repos/{owner}/{repo}/pulls', {
      owner,
      repo,
      head,
      base,
      title,
      body,
      draft,
    });
    return { number: response.data.number, url: response.data.html_url };
  } catch (error: any) {
    // Obsługa przypadku, gdy PR już istnieje
    if (
      error.status === 422 &&
      error.response?.data?.errors?.some((e: any) =>
        typeof e.message === 'string' && e.message.includes('A pull request already exists')
      )
    ) {
      // Pobierz istniejący PR dla tego brancha
      const prs = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
        owner,
        repo,
        head: `${owner}:${head}`,
        base,
        state: 'open',
      });
      if (prs.data.length > 0) {
        return { number: prs.data[0].number, url: prs.data[0].html_url };
      }
      throw new Error('PR już istnieje, ale nie udało się go pobrać.');
    }
    throw error;
  }
}

/**
 * Przykład użycia:
 *
 * import { createPullRequest } from './utils/githubProjectTasks';
 *
 * const pr = await createPullRequest({
 *   owner: 'twoj-login',
 *   repo: 'twoje-repo',
 *   head: 'feature/nowa-funkcja',
 *   base: 'main',
 *   title: 'Nowa funkcja: automatyczny update taska',
 *   body: 'Ten PR automatycznie aktualizuje status taska w projekcie GitHub.'
 * });
 * console.log(`PR utworzony: ${pr.url}`);
 */

/**
 * # Instructions for GTH_TOKEN
 *
 * 1. Create a GitHub personal access token with "project" and "repo" scopes.
 * 2. Set it in your environment variables:
 *    - In CI: add as a secret (GTH_TOKEN)
 *    - Lokalnie: export GTH_TOKEN=your_token
 * 3. Do not commit your token to the repository!
 */
