import { resolve, join } from 'node:path';

import {
    fsOpen,
    unmergeObject,
    writeInit,
    getSuffixReg,
} from './common';
import type { RurDevCallback } from './common';

interface Objunkn {
    [key: string]: any;
}

export interface Config {
    /**
     * 打包的文件地址
     */
    dir?: string;
    /**
     * 生成的文件名称
     */
    gene?: string;
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
     * 生成的文件名称
     */
    gene: 'index.ts',
};

const initObj: Objunkn = {};

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

function getDirUrl(dir?: string) {
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

export const writeCallback: RurDevCallback = function (
    url,
    file,
    urls,
) {
    const gene = getGene();
    const arr: Array<string> = [];
    console.log('urls', urls);
    console.log('file.dirs', file.dirs);
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
                arr.push(`export * from './${name}';`);
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
                arr.push(`export * from './${wjmc}';`);
            }
        });
    }
    if (arr.length > 0) {
        fsOpen(join(url, gene), arr.join('\n'));
    }
};

async function main(callback?: RurDevCallback) {
    await writeInit(getDirUrl(), (...arr) => {
        writeCallback(...arr);
        if (callback) {
            callback(...arr);
        }
    });
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
