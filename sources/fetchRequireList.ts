import {UsageError}               from 'clipanion';
import {existsSync, readFileSync} from 'fs';
import path                       from 'path';
import pkgUp                      from 'pkg-up';

export async function fetchRequireList(requireList: string[]) {
    const pkgPath = await pkgUp();
    if (pkgPath === null)
        throw new UsageError(`This command must be run from within a package`);

    const packageJson = JSON.parse(readFileSync(pkgPath, `utf8`));
    const initialRequireList: string[] = (packageJson.sherlock && packageJson.sherlock.requireList) || [];

    const sherlockSetupPath = path.join(pkgPath, `sherlock.setup.js`);
    if (existsSync(sherlockSetupPath))
        initialRequireList.push(sherlockSetupPath);

    return requireList.map(p => {
        return path.resolve(p);
    }).concat(initialRequireList.map(p => {
        return path.resolve(path.dirname(pkgPath), p);
    }));
}