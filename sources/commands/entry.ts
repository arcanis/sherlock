import Octokit                    from '@octokit/rest';
import {Command, UsageError}      from 'clipanion';
import {existsSync, readFileSync} from 'fs';
import gitUrlParse                from 'git-url-parse';
import pkgUp                      from 'pkg-up';
import * as yup                   from 'yup';

import {GITHUB_REGEXP}    from '../constants';
import {executeRepro}     from '../executeRepro';
import {extractRepro}     from '../extractRepro';
import {fetchRequireList} from '../fetchRequireList';

const oneOfType = (alternatives: yup.Schema<any>[]) => {
    const candidates = alternatives.slice(0, -1);
    const tail = alternatives[alternatives.length - 1];

    return yup.lazy(value => {
        for (const candidate of candidates) {
            try {
                candidate.validateSync(value);
                return candidate;
            } catch (error) {
                if (error.name !== `ValidationError`) {
                    throw error;
                }
            }
        }

        return tail;
    });
};

export class EntryCommand extends Command {
    @Command.String()
    issue!: string;

    @Command.Array(`--require`)
    requireList: string[] = [];

    static schema = yup.object().shape({
        issue: oneOfType([
            yup.number().integer(),
            yup.string().test(`exists`, `\${path} doesn't exist`, value => existsSync(value)),
            yup.string().matches(GITHUB_REGEXP, `The parameter must be an URL pointing to a valid GitHub issue`),
        ]),
    });

    async execute() {
        const pkgPath = await pkgUp();
        if (pkgPath === null)
            throw new UsageError(`This command must be run from within a package`);

        let body: string;

        if (existsSync(this.issue)) {
            body = readFileSync(this.issue, `utf8`);
        } else {
            const packageJson = JSON.parse(readFileSync(pkgPath, `utf8`));
            if (!packageJson.repository || packageJson.repository.type !== `git` || !packageJson.repository.url)
                throw new UsageError(`This command must be run from within a package linked to a repository`);

            const {owner, name: repo} = gitUrlParse(packageJson.repository.url);
            if (!owner || !repo)
                throw new UsageError(`This command must be run from within a package linked to a GitHub repository`);

            const octokit = new Octokit({
                auth: process.env.GITHUB_TOKEN,
            });

            if (!process.env.GITHUB_TOKEN && process.env.GITHUB_ACTIONS)
                throw new UsageError(`Missing GitHub token in the environment`);

            let issue: number;

            const githubMatch = this.issue.match(GITHUB_REGEXP);
            if (githubMatch) {
                issue = parseInt(githubMatch[3], 10);
            } else {
                issue = parseInt(this.issue);
            }

            body = (await octokit.issues.get({
                owner,
                repo,
                issue_number: issue,
            })).data.body;
        }

        const repro = extractRepro(body);
        if (!repro)
            throw new UsageError(`This issue has no reproduction case attached - check that the code fences are tagged with "\`\`\` js repro"`);

        const requireList = await fetchRequireList(this.requireList);
        const {assertion, error} = await executeRepro(repro, requireList);

        this.context.stdout.write(assertion || error);
    }
}
