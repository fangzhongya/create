import { resolve, join } from 'node:path';
import { styleLog } from '@fangzhongya/utils/log/styleLog';
import { mergeObject } from '@fangzhongya/utils/basic/object/mergeObject';
import { fsReadFile, fsAccess } from './common';
import { unmergeObject } from '@fangzhongya/utils/basic/object/unmergeObject';

import {
    FangCom,
    ConfigCallback,
    defaultConfig as defaultConfigCom,
} from './com';

import type {
    FsReaddir,
    RurDevCallback,
    Config as ConfigCom,
} from './com';

interface ObjUnkn {
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

export interface Config extends ConfigCom {
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
     * 版本配置
     */
    packageObj?: {
        [key: string]: any;
    };
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigCom,
    {
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
         * 是否run 校验 dist 文件
         */
        check: false,
        /**
         * 匹配数组
         * '' 表示匹配当前文件名
         */
        tsup: {},
        /**
         * 版本配置
         */
        packageObj: {},
    },
);

export class FangPackage extends FangCom {
    #packageObj: ObjUnkn;
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super(config, callback);
        this.#packageObj = {};
        this.setDefaultConfig(defaultConfig);
    }
    /**
     * 获取package 配置对象
     */
    async getPackageObj(pac?: string) {
        const packageUrl = this.getPackageUrl(pac);
        if (packageUrl) {
            const st = await fsReadFile(packageUrl);
            if (st) {
                this.#packageObj = JSON.parse(st);
            }
            return this.#packageObj;
        } else {
            return {};
        }
    }
    /**
     * 获取 tsup 数据
     * @param config 配置数据
     * @param packageObj  package 文件数据
     * @returns
     */
    getTsup(config?: Config, packageObj?: ObjUnkn) {
        if (config && Object.keys(config).length > 0) {
            config = this.initConfig(config);
        } else {
            config = this.config || defaultConfig;
        }
        packageObj = packageObj || this.#packageObj;
        const type = packageObj?.type;
        let tsup = config?.tsup || {};
        if (Object.keys(tsup).length == 0) {
            if (type == 'module') {
                tsup = tsupObj.module;
            } else {
                tsup = tsupObj.default;
            }
        }
        if (this.config) {
            this.config.tsup = tsup;
        }
        return tsup;
    }

    async runDev(
        callback?: RurDevCallback,
        configCallback?: ConfigCallback,
        config?: Config,
    ) {
        this.initConfig(config);
        await this.getPackageObj();
        this.getTsup();

        const call = configCallback || this._configCallback;
        if (call) {
            const c = call(this.config);
            if (c) {
                this.config = c;
            }
        }

        this.setPackageDefault();

        await this.handle(callback);

        this.setExportsObj('', 'index', true);

        this.setPackageJoon(this.#packageObj);

        if (this.config.check) {
            await this.checkDist();
        }
    }
    async deleteNon(
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
                        this.checkLog(keyok, obj[key]);
                        delete obj[key];
                    }
                } else {
                    v = await this.deleteNon(
                        v,
                        Object.keys(v),
                        keyok,
                    );
                    if (Object.keys(v).length == 0) {
                        this.checkLog(keyok, obj[key]);
                        delete obj[key];
                    } else {
                        obj[key] = v;
                    }
                }
            }
        }
        return obj;
    }
    async checkDist(config: Config = {}) {
        config = unmergeObject(
            this.config || defaultConfig,
            config,
            1,
        );
        let packageObj =
            this.#packageObj ||
            (await this.getPackageObj(config.package));

        packageObj = await this.deleteNon(
            packageObj,
            tsuparr,
        );

        let exports = packageObj.exports || {};
        exports = await this.deleteNon(
            exports,
            Object.keys(exports),
        );
        if (Object.keys(exports).length == 0) {
            this.checkLog('exports', packageObj.exports);
            delete packageObj.exports;
        } else {
            packageObj.exports = exports;
        }

        this.setPackageJoon(packageObj);
    }

    /**
     * 设置package 配置
     */
    setPackageDefault() {
        this.#packageObj.exports =
            this.#packageObj.exports || {};

        const jb = this.config.cover ? 0 : 10;

        tsuparr.forEach((k) => {
            if (this.config.tsup) {
                let tsup = this.config.tsup[k];
                if (tsup) {
                    const key = `./${this.config.dist}/index.${tsup}`;
                    this.packageLog(
                        k,
                        key,
                        this.#packageObj[k],
                    );
                    this.#packageObj[k] = key;
                }
            }
        });

        const packageObj = this.config.packageObj || {};
        Object.keys(packageObj).forEach((key) => {
            let tv = this.#packageObj[key] || {};
            this.#packageObj[key] = mergeObject(
                tv,
                packageObj[key],
                jb,
                true,
            );
        });

        const files = this.#packageObj.files || [];
        mergeObject(files, [this.config.dist], 1, true);
        this.#packageObj.files = files;

        const typesVersions =
            this.#packageObj.typesVersions || {};
        mergeObject(
            typesVersions,
            {
                '*': {
                    '*': [`./${this.config.dist}/*`],
                },
            },
            2,
            true,
        );
        this.#packageObj.typesVersions = typesVersions;
    }
    getPackageUrl(_dir?: string) {
        return join(
            process.cwd(),
            _dir ||
                this.config.package ||
                defaultConfig.package,
        );
    }
    /**
     * 生成文件
     * @param v
     * @param pac
     */
    setPackageJoon(v: Object, pac?: string) {
        const packageUrl = this.getPackageUrl(pac);
        this.fileOpen(
            packageUrl,
            JSON.stringify(v, null, 4),
            undefined,
            0,
        );
    }

    /**
     * 回调方法
     * @param url
     * @param file
     * @param urls
     */
    async writeCallback(url: string, readdir: FsReaddir) {
        readdir.file.forEach((name) => {
            const wjmc = this.getFileName(name);
            this.setExportsObj(url, wjmc);
        });
    }
    setExportsObj(
        url: string,
        name: string,
        isk?: boolean,
    ) {
        const ust = url
            .replace(this.getDirUrl(), '')
            .replace(/\\/g, '/');
        let key: string = '.' + ust;
        if (!isk) {
            key += '/' + name;
        }

        const obj = this.#packageObj.exports[key] || {};

        tsuparr.forEach((k, index) => {
            if (this.config.tsup) {
                let tsup = this.config.tsup[k];
                if (tsup) {
                    const wk = tsups[index];
                    const vkey = `./${
                        this.config.dist + ust
                    }/${name}.${tsup}`;

                    this.packageExportsLog(
                        key + '.' + wk,
                        vkey,
                        obj[wk],
                    );
                    obj[wk] = vkey;
                }
            }
        });
        this.#packageObj.exports[key] = obj;
    }
    checkLog(keyok: string, value: unknown) {
        const logs = this.getLogs();
        logs.push(
            styleLog('delete', {
                text: 6,
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
    packageLog(key: string, set: unknown, xg: unknown) {
        const logs = this.getLogs();

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
    packageExportsLog(
        key: string,
        set: unknown,
        xg: unknown,
    ) {
        const logs = this.getLogs();

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

    getLogs(type = 'package', c = 5) {
        const logs = super.getLogs();
        logs.push(
            styleLog(type, {
                text: c,
            }),
        );
        return logs;
    }
}

export function runDev(
    config: Config = {},
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangPackage(config, configCallback);
    fang.runDev(callback);
}
