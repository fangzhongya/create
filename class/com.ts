import { styleLog } from '@fangzhongya/utils/log/styleLog';
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

    /**
     * 不匹配目录数组
     * 从头开始匹配
     */
    nomatchs?: Array<string | RegExp>;
    /**
     * 不匹配文件路径
     * 从尾部开始匹配
     */
    nomatchexts?: Array<string | RegExp>;

    [key: string]: any;
}

export type ConfigCallback = (
    config: Config,
) => Config | void;

const defaultSuffixReg = /\\.[a-zA-Z]+$/;

export const defaultConfig: Config = {
    name: 'com',
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

    /**
     * 不匹配目录数组
     * 从头开始匹配
     */
    nomatchs: [],
    /**
     * 不匹配文件路径
     * 从尾部开始匹配
     */
    nomatchexts: [],
};

export function getSuffixReg(ex: Array<string> = []) {
    if (ex.length == 0) {
        return defaultSuffixReg;
    }
    return new RegExp(`\\.(${ex.join('|')})$`);
}

/**
 * 不清楚怎么定义抽象方法
 */
export class FangCom {
    _configCallback?: ConfigCallback;
    _defaultConfig: Config;
    config: Config;
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        this.config = {};
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config);
    }
    async runDev(
        callback?: RurDevCallback,
        config?: Config,
        configCallback?: ConfigCallback,
    ) {
        this.initConfig(config);
        const call = configCallback || this._configCallback;
        if (call) {
            const c = call(this.config);
            if (c) {
                this.initConfig(c);
            }
        }
        await this.handle(callback);
    }
    /**
     * 初始化
     * @param config
     * @returns
     */
    initConfig(config?: Config) {
        if (config) {
            this.config = config;

            this.setDefaultConfig();

            this.config.suffixReg = getSuffixReg(
                this.config.extensions,
            );
        }
        return this.config;
    }
    setDefaultConfig() {
        Object.keys(this._defaultConfig).forEach((key) => {
            if (typeof this.config[key] == 'undefined') {
                this.config[key] = this._defaultConfig[key];
            }
        });
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
        const str = dir || this.config.dir;
        if (str) {
            return resolve(process.cwd(), str);
        } else {
            return '';
        }
    }
    isMatchFile(url: string, name: string) {
        const dirUrl = this.getDirUrl();
        const dir = join(url, name).replace(dirUrl, '');
        const is = matchsEnd(dir, this.config.matchexts);
        const nomatchexts = this.config.nomatchexts;
        if (is && nomatchexts && nomatchexts.length > 0) {
            if (matchsEnd(dir, nomatchexts)) {
                return false;
            } else {
                return true;
            }
        } else {
            return is;
        }
    }

    isMatchDir(url: string, name: string) {
        const dirUrl = this.getDirUrl();
        const dir = join(url, name).replace(dirUrl, '');
        const is = matchsStart(dir, this.config.matchs);
        const nomatchs = this.config.nomatchs;
        if (is && nomatchs && nomatchs.length > 0) {
            if (matchsStart(dir, nomatchs)) {
                return false;
            } else {
                return true;
            }
        } else {
            return is;
        }
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
        logs.push(
            styleLog(this._defaultConfig.name, {
                text: 4,
            }),
        );
        return logs;
    }
}
