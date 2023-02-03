import { resolve } from 'node:path';

import {
    fsOpen,
    fsReadFile,
    mergeObject,
    writeInit,
} from './common';

import type { FsReaddir } from './common';

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

function initConfig() {
    const files = defaultConfig.files || [];
    mergeObject(files, [defaultConfig.dist], 1, true);
    defaultConfig.files = files;
    const typesVersions = defaultConfig.typesVersions || {};
    mergeObject(
        typesVersions,
        {
            '*': {
                '*': [`./${defaultConfig.dist}/*`],
            },
        },
        2,
        true,
    );
    defaultConfig.typesVersions = typesVersions;
    const tsup = defaultConfig.tsup || {};
    if (Object.keys(tsup).length == 0) {
        if (defaultConfig.type == 'module') {
            defaultConfig.tsup = tsupObj.module;
        } else {
            defaultConfig.tsup = tsupObj.default;
        }
    }
    initObj.packageUrl = resolve(
        process.cwd(),
        defaultConfig.package || '',
    );

    initObj.dirUrl = resolve(
        process.cwd(),
        defaultConfig.dir || '',
    );
}

function setExportsObj(
    url: string,
    name: string = 'index',
) {
    const ust = url
        .replace(initObj.dirUrl, '')
        .replace(/\\/g, '/');
    let key: string = '.' + ust;
    if (name != 'index') {
        key += '/' + name;
    }
    const obj: ObjStr = {};
    if (defaultConfig.tsup?.main) {
        obj.require = `./${
            defaultConfig.dist + ust
        }/${name}.${defaultConfig.tsup.main}`;
    }
    if (defaultConfig.tsup?.module) {
        obj.import = `./${
            defaultConfig.dist + ust
        }/${name}.${defaultConfig.tsup.module}`;
    }
    if (defaultConfig.tsup?.types) {
        obj.types = `./${
            defaultConfig.dist + ust
        }/${name}.${defaultConfig.tsup.types}`;
    }
    if (defaultConfig.exports) {
        defaultConfig.exports[key] = obj;
    }
}

async function getPackage() {
    const st = await fsReadFile(initObj.packageUrl);
    initObj.packageObj = JSON.parse(st);
}

function setPackage() {
    const jb = defaultConfig.cover ? 0 : 10;
    if (defaultConfig.tsup?.main) {
        initObj.packageObj.main = `./${defaultConfig.dist}/index.${defaultConfig.tsup.main}`;
    }
    if (defaultConfig.tsup?.module) {
        initObj.packageObj.module = `./${defaultConfig.dist}/index.${defaultConfig.tsup.module}`;
    }
    if (defaultConfig.tsup?.types) {
        initObj.packageObj.types = `./${defaultConfig.dist}/index.${defaultConfig.tsup.types}`;
    }

    let tv = initObj.packageObj.typesVersions || {};
    initObj.packageObj.typesVersions = mergeObject(
        tv,
        defaultConfig.typesVersions,
        jb,
        true,
    );

    let files = initObj.packageObj.files || [];

    initObj.packageObj.files = mergeObject(
        files,
        defaultConfig.files,
        jb,
        true,
    );

    let exports = initObj.packageObj.exports || {};

    initObj.packageObj.exports = mergeObject(
        exports,
        defaultConfig.exports,
        jb,
        true,
    );

    fsOpen(
        initObj.packageUrl,
        JSON.stringify(initObj.packageObj, null, 4),
    );
}

async function main(
    callback?: (url: string, file: FsReaddir) => void,
) {
    await getPackage();
    setExportsObj('');
    await writeInit(initObj.dirUrl, (url, file) => {
        file.file.forEach((name) => {
            const wjmc = name.replace(/\.ts$/, '');
            setExportsObj(url, wjmc);
        });
        if (callback) {
            callback(url, file);
        }
    });
    setPackage();
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
