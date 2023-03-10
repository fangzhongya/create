import { resolve, join } from 'node:path';
import {
    runDev as runDevExport,
    getDirUrl,
    exportOpen,
} from '../export';
import {
    fsMkdir,
    unmergeObject,
    styleLog,
} from '../common';
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

function getLogs() {
    const logs = [];
    logs.push(
        styleLog('[@fangzhongya/create]', {
            text: 3,
        }),
    );
    logs.push(
        styleLog('utils', {
            text: 3,
        }),
    );
    return logs;
}

export function utilOpen(
    issurl: string,
    ssurl: string,
    sts: string,
    urls?: Array<string>,
) {
    fsMkdir(issurl, (reaPath, is, ml) => {
        const logs = getLogs();
        logs.push(styleLog('dir', {}));
        if (is) {
            if (ml) {
                logs.push(
                    styleLog('add', {
                        text: 2,
                        italic: true,
                    }),
                );
                logs.push(
                    styleLog(reaPath, {
                        text: 2,
                        revert: true,
                    }),
                );
                console.log(logs.join(' '));
            }
        } else {
            logs.push(
                styleLog(reaPath, {
                    text: 1,
                    revert: true,
                }),
            );
            console.log(logs.join(' '));
        }

        exportOpen(ssurl, sts, (kurl, _type, is) => {
            if (is) {
                urls?.push(kurl);
            }
        });
    });
}

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

export const writeCallback: RurDevCallback =
    async function (url, file, urls) {
        if (file.file.length) {
            const merge: Array<string> =
                initObj.config.merge;
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
        if (url == getDirUrl()) {
            const add = await mainHandle(urls);
            file.dirs.push(...add);
        }
    };

async function mainHandle(urls?: Array<string>) {
    const merge: Array<string> = initObj.config.merge;
    const add: Array<string> = [];
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
            const ssurl = join(issurl, initObj.config.gene);
            utilOpen(issurl, ssurl, sts.join('\n'), urls);
            add.push(key + 's');
        }
    });
    return add;
}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => Config | void,
) {
    await runDevExport(
        config,
        (c) => {
            initConfig(c);
            if (configCallback) {
                const v = configCallback(initObj.config);
                if (v) {
                    initObj.config = v;
                }
            }
            return initObj.config;
        },
        writeCallback,
    );
}
