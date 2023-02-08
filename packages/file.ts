import { resolve, join } from 'node:path';

import {
    fsOpen,
    unmergeObject,
    writeInit,
    getSuffixReg,
    matchsStart,
    matchsEnd,
    fsMkdir,
    fsReadFile,
    styleLog,
    getImportUrlSuffix,
    getUrlCatalogue,
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
    name: string,
    imp: string,
    url?: string,
    arr?: string,
    files?: FsReaddir,
) => Array<string>;

export type FileGene = (
    name: string,
    url: string,
    wj?: string,
) => string;

export interface Config {
    /**
     * 打包的文件地址
     */
    dir?: string;
    /**
     * 生成的文件名称
     */
    gene?: FileGene;
    /**
     * 是否替换原来配置
     */
    cover?: boolean;
    /**
     * 读取当前文件，文件的编码类型，默认utf-8
     */
    read?: boolean | string;
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
    fileSet?: FileDatas;

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
     * 是否替换文件
     */
    cover: false,
    /**
     * 读取当前文件，文件的编码类型，默认utf-8
     */
    read: false,
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
};

const initObj: Objunkn = {};

function getLogs() {
    const logs = [];
    logs.push(
        styleLog('[@fangzhongya/create]', {
            text: 3,
        }),
    );
    logs.push(
        styleLog('file', {
            text: 4,
        }),
    );
    return logs;
}

export function fileOpen(url: string, sts: string) {
    fsMkdir(getUrlCatalogue(url), (reaPath, is, ml) => {
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

        exportOpen(url, sts);
    });
}

function exportOpen(
    url: string,
    str: string,
    callback?: FsOpenCallback,
) {
    const tn = initObj.config.cover ? 0 : 2;
    fsOpen(url, str, tn, (kurl, type, is) => {
        if (!(tn == 2 && type == 2)) {
            const logs = getLogs();
            logs.push(styleLog('file', {}));
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
        }

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

function getGene(gene?: FileGene): FileGene {
    gene =
        gene || initObj.config.gene || defaultConfig.gene;
    if (typeof gene == 'undefined') {
        return function (name: string, url: string) {
            return join(url, name);
        } as FileGene;
    } else {
        return gene;
    }
}

export const writeCallback: RurDevCallback =
    async function (url, files) {
        const gene = getGene();
        const fileSet =
            initObj.config.fileSet || defaultConfig.fileSet;
        const read =
            initObj.config.read || defaultConfig.read;
        if (files.file) {
            for (let i = 0; i < files.file.length; i++) {
                const name = files.file[i];
                const wjmc = name.replace(
                    initObj.config.suffixReg,
                    '',
                );
                const gu = gene(name, url, wjmc);
                const imp = getImportUrlSuffix(
                    gu,
                    join(url, name),
                );
                const arr: Array<string> = [];
                if (fileSet) {
                    let text = '';
                    if (read) {
                        text = await fsReadFile(
                            join(url, name),
                            read,
                        );
                    }
                    arr.push(
                        ...fileSet(
                            wjmc,
                            imp,
                            url,
                            text,
                            files,
                        ),
                    );
                }
                if (arr.length > 0) {
                    fileOpen(gu, arr.join('\n'));
                }
            }
        }
    };

const isMatchFile: IsMatch = function (url, name) {
    return matchsEnd(
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
    return matchsStart(
        dir,
        initObj.config.matchs || defaultConfig.matchs,
    );
};

async function mainHandle(callback?: RurDevCallback) {
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
    configCallback?: (config: Config) => Config | void,
    callback?: RurDevCallback,
) {
    initConfig(config);
    if (configCallback) {
        const v = configCallback(initObj.config);
        if (v) {
            initObj.config = v;
        }
    }
    await mainHandle(callback);
}
