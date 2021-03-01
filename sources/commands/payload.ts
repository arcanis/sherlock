import {Command, UsageError}         from 'clipanion';
import {readFileSync, writeFileSync} from 'fs';
import {setOutput}                   from '@actions/core'

import {CONTEXT_FILE, SHERLOCK_LABELS, WATCHED_ACTIONS, OutcomeValue, OUTCOME_KEY} from '../constants';
import {extractRepro}                                                              from '../extractRepro';
import {Context, GithubEventFile}                                                  from '../types';

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
            setOutput(OUTCOME_KEY, OutcomeValue.UNWATCHED_ACTION);
            return 0;
        }

        if (action === `unlabeled` && labels.some(({name}) => SHERLOCK_LABELS.has(name))) {
            this.context.stdout.write(`Bailout because the labels are already set (${labels.map(({name}) => name)})\n`);
            setOutput(OUTCOME_KEY, OutcomeValue.LABELS_ALREADY_SET);
            return 0;
        }

        const repro = extractRepro(body);
        if (!repro) {
            this.context.stdout.write(`Bailout because no JS code block got found\n`);
            setOutput(OUTCOME_KEY, OutcomeValue.NO_REPRO_BLOCK);
            return 0;
        }

        const context: Context = {
            labels: labels.map(label => label.name),
            repository: name,
            owner: login,
            issue: number,
            repro,
        };

        writeFileSync(CONTEXT_FILE, JSON.stringify(context, null, 2) + `\n`);
        setOutput(OUTCOME_KEY, OutcomeValue.SUCCESS);
    }
}
