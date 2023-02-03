import { resolve, join } from 'node:path';

import { fsOpen, mergeObject, writeInit } from './common';
import type { FsReaddir } from './common';

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
     * 生成的文件名称
     */
    gene: 'index.ts',
};

const initObj: Objunkn = {};

function initConfig() {
    if (!defaultConfig.dir) {
        defaultConfig.dir = './packages/';
    }
    initObj.dirUrl = resolve(
        process.cwd(),
        defaultConfig.dir,
    );
}
export function getGene(): string {
    if (!defaultConfig.gene) {
        defaultConfig.gene = 'index.ts';
    }
    return defaultConfig.gene;
}

export function writeCallback(
    gene: string,
    url: string,
    file: FsReaddir,
) {
    gene = gene || getGene();
    const arr: Array<string> = [];
    if (file.dirs) {
        file.dirs.forEach((name) => {
            arr.push(`export * from './${name}';`);
        });
    }
    if (file.file) {
        file.file.forEach((name) => {
            if (name != gene) {
                const wjmc = name.replace(/\.(ts|js)$/, '');
                arr.push(`export * from './${wjmc}';`);
            }
        });
    }
    if (arr.length > 0) {
        fsOpen(join(url, gene), arr.join('\n'));
    } else {
        fsOpen(join(url, gene), 'export {}');
    }
}

async function main(
    callback?: (url: string, file: FsReaddir) => void,
) {
    const gene = getGene();
    await writeInit(initObj.dirUrl, (url, file) => {
        writeCallback(gene, url, file);
        if (callback) {
            callback(url, file);
        }
    });
}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => void,
    callback?: (url: string, file: FsReaddir) => void,
) {
    mergeObject(defaultConfig, config, 1);
    initConfig();
    if (configCallback) {
        configCallback(defaultConfig);
    }
    await main(callback);
}
