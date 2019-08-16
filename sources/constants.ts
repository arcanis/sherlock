import path from 'path';

export const GITHUB_REGEXP = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/([0-9]+)(#.*)?$/;

export const NEUTRAL_EXIT = 78;

export const LABEL_REPRODUCIBLE = `reproducible`;
export const LABEL_BROKEN = `broken-repro`;
export const LABEL_UNREPRODUCIBLE = `unreproducible`;

export const WATCHED_ACTIONS = new Set([`opened`, `edited`, `unlabeled`]);
export const SHERLOCK_LABELS = new Set([LABEL_REPRODUCIBLE, LABEL_BROKEN, LABEL_UNREPRODUCIBLE]);

export const COMMENT_BODIES = new Map([
    [LABEL_REPRODUCIBLE, ({assertion}: any) => `This issue reproduces on master:\n\`\`\`\n${assertion}\n\`\`\``],
    [LABEL_BROKEN, ({error}: any) => `The reproduction case in your issue seems broken:\n\`\`\`\n${error}\n\`\`\``],
    [LABEL_UNREPRODUCIBLE, () => `We couldn't reproduce your issue (all the assertions passed on master).`],
]);

export const CONTEXT_FILE = path.join(process.env.GITHUB_WORKSPACE || `/tmp`, `sherlock-context.json`);
export const RESULT_FILE = path.join(process.env.GITHUB_WORKSPACE || `/tmp`, `sherlock-result.json`);
