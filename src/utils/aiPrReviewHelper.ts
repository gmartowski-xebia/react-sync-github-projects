import { Octokit } from '@octokit/core';
import fetch from 'node-fetch';

const {
  GITHUB_TOKEN,
  REPO_OWNER,
  REPO_NAME,
} = process.env;

if (!GITHUB_TOKEN || !REPO_OWNER || !REPO_NAME) {
  throw new Error('Brakuje wymaganych zmiennych środowiskowych: GITHUB_TOKEN, REPO_OWNER, REPO_NAME');
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function getPrContext(): Promise<{ number: number; title: string; body: string; diff: string; files: string[] }> {
  // Pobierz numer PR z event payload
  const event = process.env.GITHUB_EVENT_PATH ? require(process.env.GITHUB_EVENT_PATH) : null;
  const prNumber = event?.pull_request?.number;
  if (!prNumber) throw new Error('Nie można znaleźć numeru PR w event payload.');

  // Pobierz szczegóły PR
  const { data: pr } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
  });
  // Pobierz diff
  const diffResp = await fetch(pr.diff_url);
  const diff = await diffResp.text();
  // Pobierz listę plików
  const { data: files } = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: prNumber,
    per_page: 100,
  });
  return {
    number: prNumber,
    title: pr.title,
    body: pr.body || '',
    diff,
    files: files.map((f: any) => f.filename),
  };
}

async function generateReviewChecklist(prTitle: string, prBody: string, files: string[], diff: string): Promise<string> {
  // Tu można podłączyć API AI, np. OpenAI, do generowania checklisty na podstawie zmian
  // Na razie: prosta przykładowa checklista
  return [
    '### AI Review Checklist',
    '- [ ] Sprawdź zgodność zmian z opisem PR',
    '- [ ] Przejrzyj zmienione pliki: ' + files.join(', '),
    '- [ ] Zwróć uwagę na potencjalne konflikty lub breaking changes',
    '- [ ] Przetestuj nowe funkcjonalności lokalnie',
    '',
    '---',
    '#### Podsumowanie zmian:',
    prBody ? prBody : '(Brak opisu PR)',
  ].join('\n');
}

async function main() {
  const pr = await getPrContext();
  const checklist = await generateReviewChecklist(pr.title, pr.body, pr.files, pr.diff);

  // Dodaj komentarz do PR
  await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: pr.number,
    body: checklist,
  });
  console.log('AI Review Checklist dodana do PR #' + pr.number);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
