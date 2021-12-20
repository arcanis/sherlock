import expect         from 'expect';
import {readFileSync} from 'fs';
import Module         from 'module';
import path           from 'path';
import tmp            from 'tmp';
import vm             from 'vm';

const createRequire = Module.createRequire || Module.createRequireFromPath;

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
                sandbox.require = createRequire(p);
                sandbox.__dirname = path.dirname(p);
                sandbox.__filename = p;
            } else {
                sandbox.require = createRequire(path.join(process.cwd(), `repro`));
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
            if (error_ instanceof Error) {
                // Note: hasOwnProperty because in some cases they're set to undefined
                if (Object.prototype.hasOwnProperty.call(error_, `matcherResult`)) {
                    assertion = error_.stack;
                } else {
                    error = error_.stack;
                }
            } else {
                throw error_;
            }
        }

        return {assertion, error};
    });
}
