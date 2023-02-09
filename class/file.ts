import { resolve, join } from 'node:path';
import { getImportUrlSuffix } from '@fangzhongya/utils/urls/getImportUrlSuffix';
import { getReplaceUrl } from '@fangzhongya/utils/urls/getReplaceUrl';
import { getUrlCatalogueObj } from '@fangzhongya/utils/urls/getUrlCatalogueObj';

import { fsReadFile } from './common';

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

export type FileDatas = (
    //文件名称
    name: string,
    //文件目录
    url: string,
    //文件内容
    text: string,
    // 文件名称，没有后缀的
    wjm?: string,
    // 引用路径
    imp?: string,
) => Array<string>;

export type FileGene = (
    name: string,
    url: string,
    wj?: string,
) => string;

export interface Config extends ConfigCom {
    /**
     * 生成的文件名称
     */
    gene?: FileGene;
    /**
     * 文件生成方法
     */
    fileSet?: FileDatas;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigCom,
    {
        name: 'file',
        /**
         * 生成的文件名称
         */
        gene: undefined,

        /**
         * 文件生成方法
         */
        fileSet: undefined,
    },
);

export class FangFile extends FangCom {
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this.config = {};
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config);
    }
    getDefaultGene(
        name: string,
        url: string,
        _wj?: string,
    ) {
        return join(url, name);
    }
    getDefaultFileSet(
        //文件名称
        _name: string,
        //文件目录
        _url: string,
        //文件内容
        _text: string,
        // 文件名称，没有后缀的
        _wjm?: string,
        // 引用路径
        _imp?: string,
    ): string[] {
        return [];
    }
    getGeneObj(url: string, name: string, outDir: string) {
        return getUrlCatalogueObj(
            getReplaceUrl(
                join(url, name),
                resolve(process.cwd(), outDir),
            ),
        );
    }
    /**
     * 获取输出地址方法
     * @param gene
     * @returns
     */
    getGene(gene?: FileGene): FileGene {
        gene = gene || this.config.gene;
        if (!gene) {
            return (...arr) => {
                return this.getDefaultGene(...arr);
            };
        } else {
            return gene;
        }
    }
    getFileSet(fileSet?: FileDatas): FileDatas {
        fileSet = fileSet || this.config.fileSet;
        if (!fileSet) {
            return (...arr) => {
                return this.getDefaultFileSet(...arr);
            };
        } else {
            return fileSet;
        }
    }
    /**
     * 回调方法
     * @param url
     * @param file
     * @param urls
     */
    async writeCallback(url: string, readdir: FsReaddir) {
        const gene = this.getGene();
        const fileSet = this.getFileSet();
        const read = this.config.read;
        if (readdir.file) {
            for (let i = 0; i < readdir.file.length; i++) {
                const name = readdir.file[i];
                const furl = join(url, name);
                const wjmc = this.getFileName(name);
                const gu = gene(name, url, wjmc);
                const imp = getImportUrlSuffix(gu, furl);
                const arr: Array<string> = [];
                if (fileSet) {
                    let text = '';
                    if (read) {
                        text = await fsReadFile(furl, read);
                    }
                    arr.push(
                        ...fileSet(
                            name,
                            url,
                            text,
                            wjmc,
                            imp,
                        ),
                    );
                }
                if (arr.length > 0) {
                    this.fileOpen(gu, arr.join('\n'));
                }
            }
        }
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangFile(config);
    fang.runDev(callback, configCallback);
}
