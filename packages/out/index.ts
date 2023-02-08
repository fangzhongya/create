import { resolve, join } from 'node:path';
import { runDev as runDevFile } from '../file';
import {
    unmergeObject,
    getReplaceUrl,
    getUrlCatalogueObj,
} from '../common';
import type { Config as ConfigFile } from '../file';
export interface Config extends ConfigFile {
    outDir?: string;
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

    outDir: './tests/',
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

export function getGeneObj(
    url: string,
    name: string,
    outDir: string,
) {
    return getUrlCatalogueObj(
        getReplaceUrl(
            join(url, name),
            resolve(process.cwd(), outDir),
        ),
    );
}

export function getFileNeader(
    name: string,
    url: string,
): Array<string> {
    return [
        `/**`,
        ` * ${join(url, name).replace(/\\/g, '/')}`,
        ` * ${new Date().toString()}`,
        ' */',
    ];
}

export function initConfig(config: Config) {
    initObj.config = unmergeObject(
        defaultConfig,
        config,
        1,
    );
    return initObj.config;
}
function setDefault() {
    if (!initObj.config.gene) {
        initObj.config.gene = (
            name: string,
            url: string,
        ) => {
            const obj = getGeneObj(
                url,
                name,
                initObj.config.outDir,
            );
            return join(
                obj.catalogue,
                obj.name + obj.suffix,
            );
        };
    }

    if (!initObj.config.fileSet) {
        initObj.config.fileSet = (
            name: string,
            url: string,
        ) => {
            return [...getFileNeader(name, url)];
        };
    }
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
        setDefault();
        return initObj.config;
    });
}
