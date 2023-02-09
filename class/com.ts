import { styleLog } from '@fangzhongya/utils/log/styleLog';
import { unmergeObject } from '@fangzhongya/utils/basic/object/unmergeObject';
import { matchsEnd } from '@fangzhongya/utils/judge/matchsEnd';
import { matchsStart } from '@fangzhongya/utils/judge/matchsStart';
import { getUrlCatalogue } from '@fangzhongya/utils/urls/getUrlCatalogue';
import { resolve, join } from 'node:path';
import { writeInit, fsMkdir, fsOpen } from './common';

export type FsReaddir = {
    file: Array<string>;
    dirs: Array<string>;
};

export type FsOpenCallback = (
    path: string,
    type: number,
    is: boolean,
    type2?: number,
) => void;

export type RurDevCallback = (
    url: string,
    file: FsReaddir,
    urls: Array<string>,
) => void;

export interface Config {
    /**
     * 打包的文件地址
     */
    dir?: string;
    /**
     * 文件后缀
     */
    extensions?: Array<string>;
    /**
     * 文件后缀正则匹配
     */
    suffixReg?: RegExp;
    /**
     * 读取当前文件，文件的编码类型，默认utf-8
     */
    read?: boolean | string;
    /**
     * 是否覆盖已经存在的文件
     */
    fileCover?: boolean;
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

    [key: string]: any;
}

export type ConfigCallback = (
    config: Config,
) => Config | void;

const defaultSuffixReg = /\\.[a-zA-Z]+$/;

export const defaultConfig: Config = {
    /**
     * 打包的文件地址
     */
    dir: './packages/',
    /**
     * 文件后缀
     */
    extensions: ['js', 'ts'],
    suffixReg: defaultSuffixReg,
    /**
     * 是否替换文件
     */
    fileCover: false,
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

export function getSuffixReg(ex: Array<string> = []) {
    if (ex.length == 0) {
        return defaultSuffixReg;
    }
    return new RegExp(`\\.(${ex.join('|')})$`);
}

export interface Fang {
    /**
     * 配置数据
     */
    readonly config: Config;
    /**
     * 初始化配置数据
     * @param config
     * @returns
     */
    initConfig: (config: Config) => Config;

    /**
     * 获取当前位置
     * @param dir
     * @returns
     */
    getDirUrl: (dir?: string) => string | void;
    /**
     * 处理方法
     */
    handle: (callback?: RurDevCallback) => void;
    /**
     * 回调方法
     */
    writeCallback: RurDevCallback;
    /**
     * 获取日志头
     */
    getLogs: () => Array<string>;

    /**
     * 执行方法
     * @param callback
     * @param config
     * @param configCallback
     * @returns
     */
    runDev: (
        callback?: RurDevCallback,
        config?: Config,
        configCallback?: ConfigCallback,
    ) => void;
}

/**
 * 不清楚怎么定义抽象方法
 */
export abstract class FangCom implements Fang {
    _configCallback: ConfigCallback | undefined;
    config: Config;
    #defaultConfig: Config;
    constructor(
        config: Config = {},
        callback?: ConfigCallback,
    ) {
        this._configCallback = callback;
        this.#defaultConfig = defaultConfig;
        this.config = config;

        this.setDefaultConfig(defaultConfig);
    }
    setDefaultConfig(config: Config) {
        this.#defaultConfig = unmergeObject(
            this.#defaultConfig,
            config,
            1,
        );

        this.config = unmergeObject(
            this.#defaultConfig,
            this.config,
            1,
        );

        return this.initConfig(this.config);
    }
    runDev(
        callback?: RurDevCallback,
        config?: Config,
        configCallback?: ConfigCallback,
    ) {
        this.initConfig(config);
        const call = configCallback || this._configCallback;
        if (call) {
            const c = call(this.config);
            if (c) {
                this.config = c;
            }
        }
        this.handle(callback);
    }
    /**
     * 初始化
     * @param config
     * @returns
     */
    initConfig(config?: Config) {
        if (config) {
            this.config = unmergeObject(
                this.config || {},
                config,
                1,
            );
            this.config.suffixReg = getSuffixReg(
                this.config.extensions,
            );
        }
        return this.config;
    }
    getFileName(name: string) {
        if (this.config.suffixReg) {
            return name.replace(this.config.suffixReg, '');
        } else {
            return name.replace(defaultSuffixReg, '');
        }
    }
    /**
     * 获取当前位置
     * @param dir
     * @returns
     */
    getDirUrl(dir?: string) {
        const str =
            dir ||
            this.config.dir ||
            this.#defaultConfig.dir;
        if (str) {
            return resolve(process.cwd(), str);
        } else {
            return '';
        }
    }
    isMatchFile(url: string, name: string) {
        const dirUrl = this.getDirUrl();
        const dir = join(url, name).replace(dirUrl, '');
        return matchsEnd(
            dir,
            this.config.matchexts ||
                this.#defaultConfig.matchexts,
        );
    }

    isMatchDir(url: string, name: string) {
        const dirUrl = this.getDirUrl();
        const dir = join(url, name).replace(dirUrl, '');
        return matchsStart(
            dir,
            this.config.matchs ||
                this.#defaultConfig.matchs,
        );
    }
    /**
     * 处理方法
     * @param callback
     */
    async handle(callback?: RurDevCallback) {
        const url = this.getDirUrl();
        if (url) {
            await writeInit(
                url,
                (...arr) => {
                    if (callback) {
                        callback(...arr);
                    }
                    this.writeCallback(...arr);
                },
                (...arr) => {
                    return this.isMatchDir(...arr);
                },
                (...arr) => {
                    return this.isMatchFile(...arr);
                },
            );
        }
    }
    writeCallback(
        _url: string,
        _file: FsReaddir,
        _urls: Array<string>,
    ) {}

    /**
     * 输出文件，判断目录是否存在
     * @param url
     * @param sts
     */
    fileOpen(
        url: string,
        sts: string,
        fileUrls?: Array<string>,
        type?: number,
    ) {
        fsMkdir(getUrlCatalogue(url), (reaPath, is, ml) => {
            const logs = this.getLogs();
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
            this.setOpen(
                url,
                sts,
                type,
                (kurl, _type, is, _tn) => {
                    if (is && fileUrls) {
                        fileUrls.push(kurl);
                    }
                },
            );
        });
    }
    /**
     * 输出文件
     * @param url
     * @param str
     * @param callback
     */
    setOpen(
        url: string,
        str: string,
        type?: number,
        callback?: FsOpenCallback,
    ) {
        let tn = this.config.fileCover ? 0 : 2;
        if (typeof type != 'undefined') {
            tn = type;
        }
        fsOpen(url, str, tn, (kurl, type, is) => {
            if (!(tn == 2 && type == 2)) {
                const logs = this.getLogs();
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
                callback(kurl, type, is, tn);
            }
        });
    }
    /**
     * 获取日志头
     */
    getLogs() {
        const logs = [];
        logs.push(
            styleLog('[@fangzhongya/create]', {
                text: 3,
            }),
        );
        return logs;
    }
}
