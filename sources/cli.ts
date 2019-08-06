import {Cli} from 'clipanion';

import {EntryCommand}   from './commands/entry';
import {ExecCommand}    from './commands/exec';
import {PayloadCommand} from './commands/payload';
import {ReportCommand}  from './commands/report';

const cli = new Cli({
    binaryName: `yarn sherlock`,
});

cli.register(EntryCommand);
cli.register(ExecCommand);
cli.register(PayloadCommand);
cli.register(ReportCommand);

cli.runExit(process.argv.slice(2), {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
});
