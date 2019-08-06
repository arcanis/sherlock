import {Command, UsageError}         from 'clipanion';
import {readFileSync, writeFileSync} from 'fs';

import {NEUTRAL_EXIT, CONTEXT_FILE, SHERLOCK_LABELS, WATCHED_ACTIONS} from '../constants';
import {extractRepro}                                                 from '../extractRepro';
import {Context, GithubEventFile}                                     from '../types';

export class PayloadCommand extends Command {
    @Command.Path(`payload`)
    async execute() {
        if (!process.env.GITHUB_EVENT_PATH)
            throw new UsageError(`Missing GitHub event file in the environment`);

        const {
            action,
            issue: {body, labels, number},
            repository: {name, owner: {login}},
        } = JSON.parse(
            readFileSync(process.env.GITHUB_EVENT_PATH, `utf8`),
        ) as GithubEventFile;

        if (!WATCHED_ACTIONS.has(action)) {
            this.context.stdout.write(`Bailout because the action isn't watched (${action})\n`);
            return NEUTRAL_EXIT;
        }
    
        if (action === `labeled` && labels.some(({name}) => SHERLOCK_LABELS.has(name))) {
            this.context.stdout.write(`Bailout because the labels are already set (${labels.map(({name}) => name)})\n`);
            return NEUTRAL_EXIT;
        }

        const repro = extractRepro(body);
        if (!repro) {
            this.context.stdout.write(`Bailout because no JS code block got found\n`);
            return NEUTRAL_EXIT;
        }

        const context: Context = {
            labels: labels.map(label => label.name),
            repository: name,
            owner: login,
            issue: number,
            repro,
        };

        writeFileSync(CONTEXT_FILE, JSON.stringify(context, null, 2) + `\n`);
    }
}
