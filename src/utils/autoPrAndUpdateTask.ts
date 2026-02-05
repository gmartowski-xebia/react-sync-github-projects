import { createPullRequest, updateTaskStatus } from './githubProjectTasks';

const {
  GTH_TOKEN,
  OWNER,
  REPO,
  PROJECT_ID,
  ITEM_ID,
  STATUS_FIELD_ID,
  REVIEW_OPTION_ID,
  BASE_BRANCH,
} = process.env;

if (!GTH_TOKEN || !OWNER || !REPO || !PROJECT_ID || !ITEM_ID || !STATUS_FIELD_ID || !REVIEW_OPTION_ID || !BASE_BRANCH) {
  throw new Error('Brakuje wymaganych zmiennych środowiskowych!');
}

async function main() {
  // 1. Utwórz Pull Request z feature brancha na main
  const branchName = process.env.GITHUB_REF?.replace('refs/heads/', '') || '';
  if (!branchName || branchName === BASE_BRANCH) {
    console.log('Nie tworzę PR dla brancha głównego lub nieznanego.');
    return;
  }

  const prTitle = `Feature: ${branchName}`;
  const prBody = 'Automatycznie utworzony PR oraz aktualizacja statusu taska w projekcie.';

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

  // 2. Zaktualizuj status taska w projekcie na "Review"
  await updateTaskStatus({
    projectId: PROJECT_ID as string,
    itemId: ITEM_ID as string,
    statusFieldId: STATUS_FIELD_ID as string,
    newStatus: REVIEW_OPTION_ID as string,
    comment: `PR utworzony: ${pr.url}`,
  });
  console.log('Status taska zaktualizowany na Review.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
