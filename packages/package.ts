import { resolve } from 'node:path';

import {
    fsOpen,
    fsReadFile,
    unmergeObject,
    mergeObject,
    writeInit,
    getSuffixReg,
} from './common';

import type { RurDevCallback } from './common';

interface Objunkn {
    [key: string]: any;
}

interface ObjStr {
    [key: string]: string;
}

interface ExportsObj {
    [key: string]: string | ObjStr;
}

export interface Config {
    /**
     * 打包的文件地址
     */
    dir?: string;
    /**
     * 打包文件目录名称
     */
    dist?: string;
    /**
     * 文件后缀
     */
    extensions?: Array<string>;

    /**
     * package 文件名称
     */
    package?: string;
    /**
     * 是否替换原来配置
     */
    cover?: boolean;
    /**
     * 匹配数组
     * '' 表示匹配当前文件名
     */
    tsup?: {
        main?: string;
        module?: string;
        types?: string;
    };
    /**
     * exports 导出对象
     */
    exports?: ExportsObj;
    /**
     * files 目录
     */
    files?: Array<string>;

    /**
     * 版本配置
     */
    typesVersions?: {
        [key: string]: any;
    };

    [key: string]: any;
}

const tsupObj = {
    module: {
        main: 'cjs',
        module: 'js',
        types: 'd.ts',
    },
    default: {
        main: 'js',
        module: 'mjs',
        types: 'd.ts',
    },
};

const defaultConfig: Config = {
    /**
     * 打包的文件地址
     */
    dir: './packages/',
    /**
     * 打包文件目录名称
     */
    dist: 'dist',

    /**
     * 文件后缀
     */
    extensions: ['js', 'ts'],

    /**
     * package 文件名称
     */
    package: './package.json',
    /**
     * 是否替换原来配置
     */
    cover: false,
    /**
     * 匹配数组
     * '' 表示匹配当前文件名
     */
    tsup: {},
    /**
     * exports 导出对象
     */
    exports: {},
    /**
     * files 目录
     */
    files: [],

    /**
     * 版本配置
     */
    typesVersions: {},
};

const initObj: Objunkn = {};

/**
 * 初始化配置
 */
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
    const files = initObj.config.files || [];
    mergeObject(files, [initObj.config.dist], 1, true);
    initObj.config.files = files;
    const typesVersions =
        initObj.config.typesVersions || {};
    mergeObject(
        typesVersions,
        {
            '*': {
                '*': [`./${initObj.config.dist}/*`],
            },
        },
        2,
        true,
    );
    initObj.config.typesVersions = typesVersions;
    const tsup = initObj.config.tsup || {};
    if (Object.keys(tsup).length == 0) {
        if (initObj.config.type == 'module') {
            initObj.config.tsup = tsupObj.module;
        } else {
            initObj.config.tsup = tsupObj.default;
        }
    }

    return initObj.config;
}

function setExportsObj(
    url: string,
    name: string = 'index',
) {
    const ust = url
        .replace(getDirUrl(), '')
        .replace(/\\/g, '/');
    let key: string = '.' + ust;
    if (name != 'index') {
        key += '/' + name;
    }
    const obj: ObjStr = {};
    if (initObj.config.tsup?.main) {
        obj.require = `./${
            initObj.config.dist + ust
        }/${name}.${initObj.config.tsup.main}`;
    }
    if (initObj.config.tsup?.module) {
        obj.import = `./${
            initObj.config.dist + ust
        }/${name}.${initObj.config.tsup.module}`;
    }
    if (initObj.config.tsup?.types) {
        obj.types = `./${
            initObj.config.dist + ust
        }/${name}.${initObj.config.tsup.types}`;
    }
    if (initObj.config.exports) {
        initObj.config.exports[key] = obj;
    }
}

/**
 * 获取package 配置对象
 */
async function getPackage(pac?: string) {
    const packageUrl = getPackageUrl(pac);
    if (packageUrl) {
        const st = await fsReadFile(packageUrl);
        return JSON.parse(st);
    }
}

/**
 * 设置package 配置
 */
function setPackage() {
    const jb = initObj.config.cover ? 0 : 10;
    if (initObj.config.tsup?.main) {
        initObj.packageObj.main = `./${initObj.config.dist}/index.${initObj.config.tsup.main}`;
    }
    if (initObj.config.tsup?.module) {
        initObj.packageObj.module = `./${initObj.config.dist}/index.${initObj.config.tsup.module}`;
    }
    if (initObj.config.tsup?.types) {
        initObj.packageObj.types = `./${initObj.config.dist}/index.${initObj.config.tsup.types}`;
    }

    let tv = initObj.packageObj.typesVersions || {};
    initObj.packageObj.typesVersions = mergeObject(
        tv,
        initObj.config.typesVersions,
        jb,
        true,
    );

    let files = initObj.packageObj.files || [];

    initObj.packageObj.files = mergeObject(
        files,
        initObj.config.files,
        jb,
        true,
    );

    let exports = initObj.packageObj.exports || {};

    initObj.packageObj.exports = mergeObject(
        exports,
        initObj.config.exports,
        jb,
        true,
    );

    fsOpen(
        getPackageUrl(),
        JSON.stringify(initObj.packageObj, null, 4),
    );
}

function getPackageUrl(dir?: string) {
    return resolve(
        process.cwd(),
        dir ||
            initObj.config.package ||
            defaultConfig.package,
    );
}

function getDirUrl(dir?: string) {
    return resolve(
        process.cwd(),
        dir || initObj.config.dir || defaultConfig.dir,
    );
}

/**
 * 处理目录
 * @param callback
 */
async function main(callback?: RurDevCallback) {
    initObj.packageObj = await getPackage(
        initObj.config.package,
    );
    setExportsObj('');
    await writeInit(getDirUrl(), (url, file, urls) => {
        console.log('urls', urls);
        console.log('file.file', file.file);

        file.file.forEach((name) => {
            const wjmc = name.replace(
                initObj.config.suffixReg,
                '',
            );
            setExportsObj(url, wjmc);
        });
        if (callback) {
            callback(url, file, urls);
        }
    });
    setPackage();
}

/**
 * 默认执行方法
 * @param config 配置参数
 * @param configCallback 初始化参数后回调
 * @param callback 获取目录地址回调
 */
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
