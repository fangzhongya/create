import { resolve, join } from 'node:path';

import {
    fsOpen,
    unmergeObject,
    writeInit,
    getSuffixReg,
    isMatchs,
    isMatchexts,
    styleLog,
} from './common';
import type {
    FsReaddir,
    IsMatch,
    RurDevCallback,
    FsOpenCallback,
} from './common';

interface Objunkn {
    [key: string]: any;
}

export type FileDatas = (
    url: string,
    files: FsReaddir,
    name?: string | Array<string>,
) => Array<string>;

export interface Config {
    /**
     * 打包的文件地址
     */
    dir?: string;
    /**
     * 生成的文件名称
     */
    gene?: string;

    /**
     * 匹配目录数组
     * 从头开始匹配
     */
    matchs?: Array<string | RegExp>;
    /**
     * 匹配文件路径
     * 从尾部开始匹配
     */
    matchexts?: Array<string | RegExp>;

    /**
     * 文件生成方法
     */
    fileTop?: FileDatas;
    fileDirs?: FileDatas;
    fileFile?: FileDatas;
    fileEnd?: FileDatas;

    [key: string]: any;
}

const defaultConfig: Config = {
    /**
     * 打包的文件地址
     */
    dir: './packages/',
    /**
     * 文件后缀
     */
    extensions: ['js', 'ts'],

    /**
     * 匹配目录数组
     * 从头开始匹配
     */
    matchs: [],
    /**
     * 匹配文件路径
     * 从尾部开始匹配
     */
    matchexts: [],
    /**
     * 生成的文件名称
     */
    gene: 'index.ts',

    fileTop() {
        return [];
    },
    fileDirs(_url, _files, name) {
        return [`export * from './${name}';`];
    },
    fileFile(_url, _files, name) {
        return [`export * from './${name}';`];
    },
    fileEnd() {
        return [];
    },
};

const initObj: Objunkn = {};

export function exportOpen(
    url: string,
    str: string,
    callback?: FsOpenCallback,
) {
    fsOpen(url, str, (kurl, type, is) => {
        const logs: Array<string> = [];
        logs.push(
            styleLog('file', {
                bag: 2,
            }),
        );
        if (type == 1) {
            logs.push(
                styleLog('add', {
                    text: 2,
                    italic: true,
                }),
            );
        } else if (type == 2) {
            logs.push(
                styleLog('update', {
                    italic: true,
                    text: 4,
                }),
            );
        }
        if (is) {
            logs.push(
                styleLog(kurl, {
                    text: 2,
                    revert: true,
                }),
            );
        } else {
            logs.push(
                styleLog(kurl, {
                    text: 1,
                    revert: true,
                }),
            );
        }

        console.log(logs.join(' '));

        if (callback) {
            callback(kurl, type, is);
        }
    });
}

export function initConfig(config: Config) {
    initObj.config = unmergeObject(
        defaultConfig,
        config,
        1,
    );
    initObj.config.suffixReg = getSuffixReg(
        initObj.config.extensions,
        defaultConfig.extensions,
    );
    return initObj.config;
}

export function getDirUrl(dir?: string) {
    return resolve(
        process.cwd(),
        dir || initObj.config.dir || defaultConfig.dir,
    );
}

function getGene(gene?: string): string {
    return (
        gene || initObj.config.gene || defaultConfig.gene
    );
}

export const writeCallback: RurDevCallback =
    async function (url, file, urls) {
        const gene = getGene();
        const arr: Array<string> = [];
        const fileTop =
            initObj.config.fileTop || defaultConfig.fileTop;
        if (fileTop) {
            arr.push(...fileTop(url, file));
        }

        const fileDirs =
            initObj.config.fileDirs ||
            defaultConfig.fileDirs;
        const fileFile =
            initObj.config.fileFile ||
            defaultConfig.fileFile;

        if (file.dirs) {
            file.dirs.forEach((name) => {
                const diru = join(url, name);
                let is = false;
                for (const kurl of urls) {
                    if (kurl.startsWith(diru)) {
                        is = true;
                        break;
                    }
                }
                if (is) {
                    if (fileDirs) {
                        arr.push(
                            ...fileDirs(url, file, name),
                        );
                    }
                }
            });
        }
        if (file.file) {
            file.file.forEach((name) => {
                if (name != gene) {
                    const wjmc = name.replace(
                        initObj.config.suffixReg,
                        '',
                    );
                    if (fileFile) {
                        arr.push(
                            ...fileFile(url, file, wjmc),
                        );
                    }
                }
            });
        }

        const fileEnd =
            initObj.config.fileEnd || defaultConfig.fileEnd;
        if (fileEnd) {
            arr.push(...fileEnd(url, file, arr));
        }
        if (arr.length > 0) {
            exportOpen(join(url, gene), arr.join('\n'));
        }
    };

const isMatchFile: IsMatch = function (url, name) {
    return isMatchexts(
        join(url, name),
        initObj.config.matchexts || defaultConfig.matchexts,
    );
};

const isMatchDir: IsMatch = function (url, name) {
    const dirUrl = resolve(
        process.cwd(),
        initObj.config.dir || defaultConfig.dir,
    );
    const dir = join(url, name).replace(dirUrl, '');
    return isMatchs(
        dir,
        initObj.config.matchs || defaultConfig.matchs,
    );
};

async function main(callback?: RurDevCallback) {
    await writeInit(
        getDirUrl(),
        (...arr) => {
            if (callback) {
                callback(...arr);
            }
            writeCallback(...arr);
        },
        isMatchDir,
        isMatchFile,
    );
}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => void,
    callback?: RurDevCallback,
) {
    initConfig(config);
    if (configCallback) {
        configCallback(initObj.config);
    }
    await main(callback);
}
