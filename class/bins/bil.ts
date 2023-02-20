import { getUrlCatalogueLast } from '@fangzhongya/utils/urls/getUrlCatalogueLast';
import { join } from 'node:path';
import {
    FangCom,
    ConfigCallback,
    defaultConfig as defaultConfigCom,
} from '../com';

import type {
    FsReaddir,
    RurDevCallback,
    Config as ConfigCom,
} from '../com';

export type FileDatas = (
    // 文件地址
    url: string,
    // 文件目录对象
    files: FsReaddir,
    // 目录名称，文件名称 ，text数组
    name?: string | string[],
    // 文件名
    wjmc?: string | string[],
) => string | Promise<string>;

export interface Config extends ConfigCom {
    fileFilter?: FileDatas;
    /**
     * 分割线
     */
    branch?: string;

    directives?: boolean;

    /**
     * 替换头的完整路径
     */
    dittop?: string;
    /**
     * 拼接头
     */
    splicetop?: string;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigCom,
    {
        name: 'bil',
        branch: '/',
        fileFilter(
            _url: string,
            _files: FsReaddir,
            _name: Array<string>,
            _fileUrls: Array<string>,
        ) {
            return '';
        },
    } as Config,
);

export class FangBil extends FangCom {
    _libObj: {
        [key: string]: { name: string; url: string };
    };
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this.config = {};
        this._libObj = {};
        this._configCallback = callback;
        defaultConfig.fileFilter = (
            url: string,
            files: FsReaddir,
            arr?: Array<string> | string,
        ) => {
            return this.setFileEnd(
                url,
                files,
                arr as string[],
            );
        };
        this._defaultConfig = defaultConfig;
        this.initConfig(config || this.config);
    }

    /**
     * 获取当前位置
     * @param dir
     * @returns
     */
    getDirUrl(dir?: string) {
        const str = dir || this.config.dir;
        if (str) {
            return str;
        } else {
            return '';
        }
    }

    async setFileEnd(
        url: string,
        files: FsReaddir,
        arr: Array<string>,
    ) {
        if (this.config.directives) {
            if (
                files.file.length > 0 &&
                files.file.includes('index.ts')
            ) {
                const key = getUrlCatalogueLast(url);
                this._libObj[key] = {
                    name: key,
                    url: url,
                };
                return url;
            } else {
                return '';
            }
        } else {
            if (
                files.dirs.length > 0 &&
                files.dirs.includes('src')
            ) {
                const mlz = getUrlCatalogueLast(url);
                const key = url
                    .replace(this.config.dittop, '')
                    .substring(1)
                    .replace(
                        /[\\|\/]/g,
                        this.config.branch,
                    );

                let mc = join(
                    this.config.splicetop,
                    mlz,
                ).replace(/[\\|\/]/g, this.config.branch);
                this._libObj[key] = {
                    name: mc,
                    url: url,
                };
                return url;
            } else {
                return '';
            }
        }
    }

    public getLibObj() {
        return this._libObj;
    }

    /**
     * 回调方法
     * @param url
     * @param file
     * @param urls
     */
    async writeCallback(
        url: string,
        readdir: FsReaddir,
        fileUrls: string[],
    ) {
        const arr: Array<string> = [];

        const fileFilter = this.config.fileFilter;

        if (fileFilter) {
            arr.push(
                ...(await fileFilter(
                    url,
                    readdir,
                    arr,
                    fileUrls,
                )),
            );
        }
        if (arr.length > 0) {
        }
    }
}

export async function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangBil(config);
    await fang.runDev(callback, configCallback);
    return fang;
}
