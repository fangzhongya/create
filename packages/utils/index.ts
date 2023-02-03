import { resolve, join } from 'node:path';
import { runDev as exportRunDev } from '../export';
import { fsMkdir, fsOpen, unmergeObject } from '../common';
import type { RurDevCallback } from '../common';
import type { Config as ConfigExport } from '../export';
export interface Config extends ConfigExport {
    /**
     * 合并文件头
     */
    merge?: Array<string>;
}

interface Objunkn {
    [key: string]: any;
}

interface IssObj {
    name: string;
    url: string;
}

const initObj: Objunkn = {};

const defaultConfig: Config = {
    /**
     * 合并文件头
     */
    merge: ['is'],
};

export function initConfig(config: Config) {
    initObj.config = unmergeObject(
        defaultConfig,
        config,
        1,
    );
    const merge: Array<string> = initObj.config.merge;
    if (merge) {
        merge.forEach((key) => {
            initObj[key + 's'] = [] as Array<IssObj>;
        });
    }
    return initObj.config;
}

export const writeCallback: RurDevCallback = function (
    url,
    file,
) {
    if (file.file.length) {
        const merge: Array<string> = initObj.config.merge;
        file.file.forEach((name) => {
            const wjmc = name.replace(
                initObj.config.suffixReg,
                '',
            );
            merge.forEach((key) => {
                const reg = new RegExp(
                    `^(${key})[A-Z]([a-z|A-Z])+?$`,
                );
                const rex = reg.exec(wjmc);
                if (rex && rex.length > 0) {
                    const sk = rex[1] + 's';
                    initObj[sk].push({
                        name: wjmc,
                        url,
                    });
                }
            });
        });
    }
};

export async function main() {
    const merge: Array<string> = initObj.config.merge;
    merge.forEach((key) => {
        let arr = initObj[key + 's'];
        if (arr.length > 0) {
            const dirUrl = resolve(
                process.cwd(),
                initObj.config.dir,
            );
            const sts: Array<string> = [];
            arr.forEach((data: IssObj) => {
                const ust = data.url
                    .replace(dirUrl, '')
                    .replace(/\\/g, '/');
                sts.push(
                    `export * from '..${
                        ust + '/' + data.name
                    }';`,
                );
            });
            const issurl = join(dirUrl, key + 's');
            fsMkdir(issurl, () => {
                fsOpen(
                    join(issurl, initObj.config.gene),
                    sts.join('\n'),
                );
            });
        }
    });
}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => void,
) {
    await exportRunDev(
        config,
        (c) => {
            initConfig(c);
            if (configCallback) {
                configCallback(c);
            }
        },
        writeCallback,
    );
    await main();
}
