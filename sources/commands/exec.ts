import {Command, UsageError}         from 'clipanion';
import {readFileSync, writeFileSync} from 'fs';

import {CONTEXT_FILE, RESULT_FILE} from '../constants';
import {executeRepro}              from '../executeRepro';
import {Context}                   from '../types';

export class ExecCommand extends Command {
    @Command.Boolean(`--unsafe`)
    unsafe: boolean = false;

    @Command.Array(`--require`)
    requireList: string[] = [];

    @Command.Path(`exec`)
    async execute() {
        if (process.env.GITHUB_TOKEN && !this.unsafe)
            throw new UsageError(`This command should not be run if you have access to the secret token`);

        const context = JSON.parse(readFileSync(CONTEXT_FILE, `utf8`)) as Context;
        const {assertion, error} = await executeRepro(context.repro, this.requireList);
        
        writeFileSync(RESULT_FILE, JSON.stringify({
            assertion,
            error,
        }) + `\n`);
    }
}