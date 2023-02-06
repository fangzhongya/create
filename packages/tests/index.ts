import { resolve, join } from 'node:path';
import { runDev as runDevFile } from '../file';
import {
    unmergeObject,
    getReplaceUrl,
    getUrlCatalogueObj,
} from '../common';
import type { Config as ConfigFile } from '../file';
export interface Config extends ConfigFile {
    tests?: string;
}

interface Objunkn {
    [key: string]: any;
}

const initObj: Objunkn = {};

const defaultConfig: Config = {
    /**
     * 打包的文件地址
     */
    dir: './packages/',
    /**
     * 文件后缀
     */
    extensions: ['js', 'ts'],

    tests: './tests',
    /**
     * 是否替换原来配置
     */
    cover: false,
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
    gene: undefined,

    fileSet: undefined,
};

export function initConfig(config: Config) {
    initObj.config = unmergeObject(
        defaultConfig,
        config,
        1,
    );

    const testUrl = resolve(
        process.cwd(),
        initObj.config.tests,
    );

    const gene = initObj.config.gene;
    if (!gene) {
        initObj.config.gene = (
            name: string,
            url: string,
        ) => {
            const obj = getUrlCatalogueObj(
                getReplaceUrl(join(url, name), testUrl),
            );
            return join(
                obj.catalogue,
                obj.name + '.test' + obj.suffix,
            );
        };
    }

    const fileSet = initObj.config.fileSet;
    if (!fileSet) {
        initObj.config.fileSet = (
            name: string,
            imp: string,
        ) => {
            return [
                `import { test, expect } from 'vitest';`,
                `import { ${name} } from '${imp}';`,
                '',
                `test('${imp}', () => {`,
                `        expect(${name}( )).toBe( );`,
                ` });`,
            ];
        };
    }

    return initObj.config;
}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => Config | void,
) {
    await runDevFile(config, (c) => {
        initConfig(c);
        if (configCallback) {
            const v = configCallback(initObj.config);
            if (v) {
                initObj.config = v;
            }
        }
        return initObj.config;
    });
}
