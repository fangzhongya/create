import { resolve, join } from 'node:path';

import {
    fsOpen,
    fsReadFile,
    unmergeObject,
    mergeObject,
    writeInit,
    getSuffixReg,
    fsAccess,
    isMatchs,
    isMatchexts,
    styleLog,
} from './common';

import type { IsMatch, RurDevCallback } from './common';

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
     * package 文件名称
     */
    package?: string;
    /**
     * 是否替换原来配置
     */
    cover?: boolean;
    /**
     * 是否run 校验 dist 文件
     */
    check?: boolean;
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
    arr: {
        main: 'require',
        module: 'import',
        types: 'types',
    },
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

const tsuparr = Object.keys(tsupObj.arr);
const tsups = Object.values(tsupObj.arr);

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
     * package 文件名称
     */
    package: './package.json',
    /**
     * 是否替换原来配置
     */
    cover: false,
    /**
     * 是否run 校验 dist 文件
     */
    check: true,
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

    return initObj.config;
}

/**
 * 获取 tsup 数据
 * @param config 配置数据
 * @param packageObj  package 文件数据
 * @returns
 */
function getTsup(config?: Config, packageObj?: Objunkn) {
    if (config && Object.keys(config).length > 0) {
        config = initConfig(config);
    } else {
        config = initObj.config || defaultConfig;
    }
    packageObj = packageObj || initObj.packageObj;
    const type = packageObj?.type;
    let tsup = config?.tsup || {};
    if (Object.keys(tsup).length == 0) {
        if (type == 'module') {
            tsup = tsupObj.module;
        } else {
            tsup = tsupObj.default;
        }
    }
    if (initObj.config) {
        initObj.config.tsup = tsup;
    }
    return tsup;
}

function packageLog(
    key: string,
    set: unknown,
    xg: unknown,
) {
    const logs = [];
    logs.push(
        styleLog('package', {
            bag: 7,
        }),
    );

    if (xg) {
        logs.push(
            styleLog('update', {
                text: 4,
                italic: true,
            }),
        );
    } else {
        logs.push(
            styleLog('add', {
                text: 2,
                italic: true,
            }),
        );
    }

    logs.push(
        styleLog(key, {
            bold: true,
        }),
    );

    logs.push(
        styleLog(JSON.stringify(set, null, 4), {
            text: 2,
        }),
    );

    if (xg) {
        logs.push(
            styleLog(JSON.stringify(xg, null, 4), {
                text: 1,
                lineThrough: true,
            }),
        );
    }
    console.log(logs.join(' '));
}

function packageExportsLog(
    key: string,
    set: unknown,
    xg: unknown,
) {
    const logs = [];
    logs.push(
        styleLog('package', {
            bag: 7,
        }),
    );

    if (xg) {
        logs.push(
            styleLog('update', {
                text: 4,
                italic: true,
            }),
        );
    } else {
        logs.push(
            styleLog('add', {
                text: 2,
                italic: true,
            }),
        );
    }

    logs.push(
        styleLog('exports.' + key, {
            bold: true,
        }),
    );

    logs.push(
        styleLog(JSON.stringify(set, null, 4), {
            text: 2,
        }),
    );

    if (xg) {
        logs.push(
            styleLog(JSON.stringify(xg, null, 4), {
                text: 1,
                lineThrough: true,
            }),
        );
    }
    console.log(logs.join(' '));
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

    const obj = initObj.config.exports[key] || {};

    tsuparr.forEach((k, index) => {
        if (initObj.config.tsup) {
            let tsup = initObj.config.tsup[k];
            if (tsup) {
                const wk = tsups[index];
                const vkey = `./${
                    initObj.config.dist + ust
                }/${name}.${tsup}`;
                packageExportsLog(
                    key + '.' + wk,
                    vkey,
                    obj[wk],
                );
                obj[wk] = vkey;
            }
        }
    });
    initObj.config.exports[key] = obj;
}

/**
 * 获取package 配置对象
 */
async function getPackageObj(pac?: string) {
    const packageUrl = getPackageUrl(pac);
    if (packageUrl) {
        const st = await fsReadFile(packageUrl);
        initObj.packageObj = JSON.parse(st);
        return initObj.packageObj;
    }
}

/**
 * 获取package 配置对象
 */
function setPackageJoon(v: Object, pac?: string) {
    const packageUrl = getPackageUrl(pac);
    fsOpen(packageUrl, JSON.stringify(v, null, 4));
}

/**
 * 设置package 配置
 */
function setPackage() {
    const jb = initObj.config.cover ? 0 : 10;

    tsuparr.forEach((k) => {
        if (initObj.config.tsup) {
            let tsup = initObj.config.tsup[k];
            if (tsup) {
                const key = `./${initObj.config.dist}/index.${tsup}`;
                packageLog(k, key, initObj.packageObj[k]);
                initObj.packageObj[k] = key;
            }
        }
    });

    if (!initObj.packageObj?.exports['.']) {
        setExportsObj('');
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

    setPackageJoon(initObj.packageObj);
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

const isMatchFile: IsMatch = function (url, name) {
    return isMatchexts(join(url, name), initObj.matchexts);
};

const isMatchDir: IsMatch = function (url, name) {
    const dirUrl = resolve(
        process.cwd(),
        initObj.config.dir,
    );
    const dir = join(url, name).replace(dirUrl, '');
    return isMatchs(dir, initObj.matchs);
};

/**
 * 处理目录
 * @param callback
 */
async function main(callback?: RurDevCallback) {
    initObj.packageObj.exports =
        initObj.packageObj.exports || {};

    await writeInit(
        getDirUrl(),
        (url, file, urls) => {
            if (callback) {
                callback(url, file, urls);
            }
            file.file.forEach((name) => {
                const wjmc = name.replace(
                    initObj.config.suffixReg,
                    '',
                );
                setExportsObj(url, wjmc);
            });
        },
        isMatchDir,
        isMatchFile,
    );
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
    await getPackageObj();
    getTsup();
    if (configCallback) {
        configCallback(initObj.config);
    }
    await main(callback);

    if (initObj.config.check) {
        await checkDist();
    }
}

function checkLog(keyok: string, value: unknown) {
    const logs = [];

    logs.push(
        styleLog('package', {
            bag: 7,
        }),
    );
    logs.push(
        styleLog('delete', {
            text: 5,
            italic: true,
        }),
    );
    logs.push(
        styleLog(keyok, {
            bold: true,
        }),
    );
    logs.push(
        styleLog(JSON.stringify(value, null, 4), {
            text: 1,
            lineThrough: true,
        }),
    );
    console.log(logs.join(' '));
}

async function deleteNon(
    obj: { [key: string]: any },
    arr: Array<string>,
    objkey?: string,
) {
    for (const key of arr) {
        if (obj[key]) {
            let v = obj[key];
            let keyok = key;
            if (objkey) {
                keyok = objkey + '.' + key;
            }
            if (typeof v == 'string') {
                const is = await fsAccess(
                    resolve(process.cwd(), obj[key]),
                );
                if (!is) {
                    checkLog(keyok, obj[key]);
                    delete obj[key];
                }
            } else {
                v = await deleteNon(
                    v,
                    Object.keys(v),
                    keyok,
                );
                if (Object.keys(v).length == 0) {
                    checkLog(keyok, obj[key]);
                    delete obj[key];
                } else {
                    obj[key] = v;
                }
            }
        }
    }
    return obj;
}

export async function checkDist(config: Config = {}) {
    config = unmergeObject(
        initObj.config || defaultConfig,
        config,
        1,
    );
    let packageObj =
        initObj.packageObj ||
        (await getPackageObj(config.package));

    packageObj = await deleteNon(packageObj, tsuparr);

    let exports = packageObj.exports || {};
    exports = await deleteNon(
        exports,
        Object.keys(exports),
    );
    if (Object.keys(exports).length == 0) {
        checkLog('exports', packageObj.exports);
        delete packageObj.exports;
    } else {
        packageObj.exports = exports;
    }
    setPackageJoon(packageObj, config.package);
}
