import expect                  from 'expect';
import {readFileSync}          from 'fs';
// @ts-ignore
import {createRequireFromPath} from 'module';
import path                    from 'path';
import tmp                     from 'tmp';
import vm                      from 'vm';

async function executeInTempDirectory<T>(fn: () => Promise<T>) {
    const cwd = process.cwd();
    process.chdir(tmp.dirSync({unsafeCleanup: true}).name);

    try {
        return await fn();
    } finally {
        process.chdir(cwd);
    }
}

export async function executeRepro(code: string, requireList: string[]) {
    return await executeInTempDirectory(async () => {
        const global = {} as any;
        global.global = global;
        global.expect = expect;
        global.process = process;
        global.console = console;

        const runCode = (code: string, p: string | null) => {
            const sandbox = Object.create(global);
            sandbox.module = {exports: {}};
            sandbox.exports = sandbox.module.exports;
            vm.createContext(sandbox);

            if (p !== null) {
                sandbox.require = createRequireFromPath(p);
                sandbox.__dirname = path.dirname(p);
                sandbox.__filename = p;
            } else {
                sandbox.require = createRequireFromPath(path.join(process.cwd(), `repro`));
            }

            vm.runInContext(code, sandbox);

            return sandbox.module.exports;
        };

        for (const r of requireList) {
            const rPath = path.resolve(r);
            const rCode = readFileSync(rPath, `utf8`);

            runCode(rCode, rPath);
        }

        const wrap = (code: string) => `module.exports = async () => {\n${code}\n};\n`;
        const test = runCode(wrap(code), null);

        let assertion;
        let error;

        try {
            await test();
        } catch (error_) {
            // Note: hasOwnProperty because in some cases they're set to undefined
            if (Object.prototype.hasOwnProperty.call(error_, `matcherResult`)) {
                assertion = error_.stack;
            } else {
                error = error_.stack;
            }
        }

        return {assertion, error};
    });
}
