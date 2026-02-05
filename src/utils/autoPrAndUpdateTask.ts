import { createPullRequest, updateTaskStatus, fetchTaskById } from './githubProjectTasks';
import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/core';

const {
  GTH_TOKEN,
  OWNER,
  REPO,
  PROJECT_ID,
  BASE_BRANCH,
} = process.env;

const missingVars = [
  ['GTH_TOKEN', GTH_TOKEN],
  ['OWNER', OWNER],
  ['REPO', REPO],
  ['PROJECT_ID', PROJECT_ID],
  ['BASE_BRANCH', BASE_BRANCH],
].filter(([name, value]) => !value).map(([name]) => name);

if (missingVars.length > 0) {
  throw new Error(`Brakuje wymaganych zmiennych środowiskowych: ${missingVars.join(', ')}`);
}

const graphqlWithAuth = graphql.defaults({ headers: { authorization: `token ${GTH_TOKEN}` } });

async function getStatusFieldId(projectId: string): Promise<string> {
  const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
              }
            }
          }
        }
      }
    }
  `;
  const result = await graphqlWithAuth(query, { projectId }) as any;
  const statusField = result.node.fields.nodes.find((f: any) => f.name === 'Status');
  if (!statusField) throw new Error('Nie znaleziono pola Status w projekcie!');
  return statusField.id;
}

async function getReviewOptionId(statusFieldId: string): Promise<string> {
  const query = `
    query($fieldId: ID!) {
      node(id: $fieldId) {
        ... on ProjectV2SingleSelectField {
          options {
            id
            name
          }
        }
      }
    }
  `;
  const result = await graphqlWithAuth(query, { fieldId: statusFieldId }) as any;
  // Zmieniamy wyszukiwanie opcji na 'In review' zamiast 'Review'
  const reviewOption = result.node.options.find((o: any) => o.name === 'In review');
  if (!reviewOption) {
    console.error('Dostępne opcje statusu:', result.node.options.map((o: any) => o.name));
    throw new Error('Nie znaleziono opcji In review w polu Status!');
  }
  return reviewOption.id;
}

async function getItemId(projectId: string, branchName: string): Promise<string> {
  // Szukaj taska powiązanego z numerem issue/PR w nazwie brancha, np. feature/123-nazwa
  const match = branchName.match(/(\d+)/);
  if (!match) throw new Error('Branch nie zawiera numeru issue/PR!');
  const issueNumber = match[1];
  const query = `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 50) {
            nodes {
              id
              content {
                ... on Issue { number }
                ... on PullRequest { number }
              }
            }
          }
        }
      }
    }
  `;
  const result = await graphqlWithAuth(query, { projectId }) as any;
  const item = result.node.items.nodes.find((i: any) => i.content?.number?.toString() === issueNumber);
  if (!item) throw new Error(`Nie znaleziono taska powiązanego z numerem ${issueNumber} w projekcie!`);
  return item.id;
}

async function getBranchCommits(owner: string, repo: string, branch: string, token: string): Promise<string[]> {
  const octokit = new Octokit({ auth: token });
  const commits: string[] = [];
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
      owner,
      repo,
      sha: branch,
      per_page: 10,
    });
    for (const commit of data) {
      commits.push(commit.commit.message);
    }
  } catch (err) {
    console.warn('Nie udało się pobrać commitów:', err);
  }
  return commits;
}

async function generatePrBody(commits: string[]): Promise<string> {
  // Tu można podłączyć API AI, np. OpenAI, do generowania opisu na podstawie commitów
  // Na razie: proste podsumowanie
  if (commits.length === 0) return 'Brak commitów do podsumowania.';
  return `Podsumowanie zmian w PR:\n${commits.map((msg, i) => `- ${msg}`).join('\n')}`;
}

async function main() {
  const branchName = process.env.GITHUB_REF?.replace('refs/heads/', '') || '';
  if (!branchName || branchName === BASE_BRANCH) {
    console.log('Nie tworzę PR dla brancha głównego lub nieznanego.');
    return;
  }

  const prTitle = `Feature: ${branchName}`;
  const commits = await getBranchCommits(OWNER as string, REPO as string, branchName, GTH_TOKEN as string);
  const prBody = await generatePrBody(commits);

  console.log('PR debug info:', {
    owner: OWNER,
    repo: REPO,
    head: branchName,
    base: BASE_BRANCH,
    title: prTitle,
    body: prBody,
  });
  const pr = await createPullRequest({
    owner: OWNER as string,
    repo: REPO as string,
    head: branchName,
    base: BASE_BRANCH as string,
    title: prTitle,
    body: prBody,
    draft: false,
  });
  console.log(`PR utworzony: ${pr.url}`);

  // Dynamiczne pobieranie ID taska, pola Status i opcji Review
  const statusFieldId = await getStatusFieldId(PROJECT_ID as string);
  const reviewOptionId = await getReviewOptionId(statusFieldId);
  const itemId = await getItemId(PROJECT_ID as string, branchName);

  await updateTaskStatus({
    projectId: PROJECT_ID as string,
    itemId,
    statusFieldId,
    newStatus: reviewOptionId,
    comment: `PR utworzony: ${pr.url}`,
  });
  console.log('Status taska zaktualizowany na Review.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
