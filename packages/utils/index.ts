import { resolve, join } from 'node:path';
import { runDev as exportRunDev, getGene } from '../export';
import { fsMkdir, fsOpen } from '../common';
import type { Config as ConfigExport } from '../export';
import type { FsReaddir } from '../common';
export interface Config extends ConfigExport {}

interface Objunkn {
    [key: string]: any;
}

interface IssObj {
    name: string;
    url: string;
}

const initObj: Objunkn = {};

function initConfig() {
    initObj.iss = [] as Array<IssObj>;
}

export function writeCallback(
    url: string,
    file: FsReaddir,
) {
    console.log('writeCallback', file);

    if (file.file.length) {
        file.file.forEach((name) => {
            const wjmc = name.replace(/\.(ts|js)$/, '');
            if (/^is[A-Z]([a-z|A-Z])+?$/.test(wjmc)) {
                initObj.iss.push({
                    name: wjmc,
                    url,
                });
            }
        });
    }
}

export async function main() {
    const gene = getGene();

    if (initObj.iss.length > 0) {
        const issurl = resolve(
            process.cwd(),
            initObj.config.dir + 'iss',
        );
        const arr: Array<string> = [];
        initObj.iss.forEach((data: IssObj) => {
            const ust = data.url
                .replace(initObj.dirUrl, '')
                .replace(/\\/g, '/');
            arr.push(
                `export * from '..${
                    ust + '/' + data.name
                }';`,
            );
        });
        fsMkdir(issurl, () => {
            fsOpen(join(issurl, gene), arr.join('\n'));
        });
    }
}

export async function runDev(config: Config = {}) {
    initConfig();
    await exportRunDev(
        config,
        (c) => {
            initObj.config = c;
        },
        writeCallback,
    );
    main();
}
