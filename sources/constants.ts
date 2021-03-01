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
    [LABEL_BROKEN, ({error}: any) => `The reproduction case in your issue seems broken (ie it neither pass nor fail due to throwing an unmanaged exception):\n\`\`\`\n${error}\n\`\`\`\n\nRemember: any non-Jest exceptions will cause the test to be reported as broken. If you expect something to pass without throwing, you must wrap it into something like \`await expect(...).resolves.toBeTruthy()\`. If you instead expect something to throw, you need to wrap it into \`await expect(...).rejects.toThrow()\`.`],
    [LABEL_UNREPRODUCIBLE, () => `We couldn't reproduce your issue (all the assertions passed on master).`],
]);

export const CONTEXT_FILE = path.join(process.env.GITHUB_WORKSPACE || `/tmp`, `sherlock-context.json`);
export const RESULT_FILE = path.join(process.env.GITHUB_WORKSPACE || `/tmp`, `sherlock-result.json`);

export const OUTCOME_KEY = `outcome`

export enum OutcomeValue {
    UNWATCHED_ACTION = "unwatched action",
    LABELS_ALREADY_SET = "labels already set",
    NO_REPRO_BLOCK = "no repro block",
    SUCCESS = "success",
}
