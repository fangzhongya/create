import { join } from 'node:path';

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
    // 文件地址
    url: string,
    // 文件目录对象
    files: FsReaddir,
    // 目录名称，文件名称 ，text数组
    name?: string | string[],
    // 文件名
    wjmc?: string | string[],
) => string[] | Promise<string[]>;

export interface Config extends ConfigCom {
    /**
     * 生成的文件名称
     */
    gene?: string;
    /**
     * 文件生成方法
     */
    fileTop?: FileDatas;
    fileDirs?: FileDatas;
    fileFile?: FileDatas;
    fileEnd?: FileDatas;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigCom,
    {
        name: 'export',
        /**
         * 生成的文件名称
         */
        gene: 'index.ts',

        fileTop(_url: string, _files: FsReaddir) {
            return [] as string[];
        },
        fileDirs(
            _url: string,
            _files: FsReaddir,
            name: string,
        ) {
            return [`export * from './${name}';`];
        },
        fileFile(
            _url: string,
            _files: FsReaddir,
            _name: string,
            wjmc: string,
        ) {
            return [`export * from './${wjmc}';`];
        },
        fileEnd(
            _url: string,
            _files: FsReaddir,
            _name: Array<string>,
            _fileUrls: Array<string>,
        ) {
            return [] as string[];
        },
    } as Config,
);

export class FangExport extends FangCom {
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this.config = {};
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config || this.config);
    }
    getGene(gene?: string) {
        return gene || this.config.gene;
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
        const gene = this.getGene();
        const arr: Array<string> = [];
        const fileTop = this.config.fileTop;
        if (fileTop) {
            arr.push(...fileTop(url, readdir));
        }

        const fileDirs = this.config.fileDirs;
        const fileFile = this.config.fileFile;

        if (readdir.dirs) {
            readdir.dirs.forEach((name) => {
                const diru = join(url, name);
                let is = false;
                for (const kurl of fileUrls) {
                    if (kurl.startsWith(diru)) {
                        is = true;
                        break;
                    }
                }
                if (is) {
                    if (fileDirs) {
                        arr.push(
                            ...fileDirs(url, readdir, name),
                        );
                    }
                }
            });
        }
        if (readdir.file) {
            readdir.file.forEach((name) => {
                if (name != gene) {
                    const wjmc = this.getFileName(name);
                    if (fileFile) {
                        arr.push(
                            ...fileFile(
                                url,
                                readdir,
                                name,
                                wjmc,
                            ),
                        );
                    }
                }
            });
        }

        const fileEnd = this.config.fileEnd;

        if (fileEnd) {
            arr.push(
                ...(await fileEnd(
                    url,
                    readdir,
                    arr,
                    fileUrls,
                )),
            );
        }
        if (arr.length > 0) {
            this.fileOpen(
                join(url, gene),
                arr.join('\n'),
                fileUrls,
            );
        }
    }
}

export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangExport(config);
    fang.runDev(callback, configCallback);
}
