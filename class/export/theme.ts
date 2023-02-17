import { getImportUrl } from '@fangzhongya/utils/urls/getImportUrl';

import { join } from 'node:path';
import {
    defaultConfig as defaultConfigExport,
    FangExport,
} from '../export';

import type { Config as ConfigExport } from '../export';
import type {
    RurDevCallback,
    ConfigCallback,
    FsReaddir,
} from '../com';

export interface Config extends ConfigExport {}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigExport,
    {
        name: 'theme',
        /**
         * 合并文件头
         */
        extensions: ['css', 'scss'],
        gene: 'index.scss',
        matchexts: [],

        fileTop(_url: string, _files: FsReaddir) {
            return [] as string[];
        },
        fileDirs(
            _url: string,
            _files: FsReaddir,
            _name: string,
        ) {
            return [] as string[];
        },
        fileFile(
            _url: string,
            _files: FsReaddir,
            _name: string,
            _wjmc: string,
        ) {
            return [] as string[];
        },
        fileEnd(
            _url: string,
            _files: FsReaddir,
            _name: Array<string>,
            _fileUrls?: string[],
        ) {
            return [] as string[];
        },
    },
);

export class FangTheme extends FangExport {
    _indexUrls: string[];
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this._indexUrls = [];
        this.config = {};
        this._configCallback = callback;

        const hz =
            defaultConfig.extensions?.join('|') ||
            '[a-z|A-Z]+';
        const reg = new RegExp(
            `[\\\\|\\/]src[\\\\|\\/]([^\\\\|\\/]+)\\.(${hz})$`,
        );
        defaultConfig.matchexts?.push(reg);
        defaultConfig.fileEnd = (
            url: string,
            files: FsReaddir,
            arr?: Array<string> | string,
            fileUrls?: string[] | string,
        ) => {
            return this.setFileEnd(
                url,
                files,
                arr as string[],
                fileUrls as string[],
            );
        };
        this._defaultConfig = defaultConfig;
        this.initConfig(config);
    }
    setFileEnd(
        url: string,
        files: FsReaddir,
        arr: Array<string>,
        fileUrls: string[],
    ) {
        if (arr instanceof Array) {
            arr.splice(0, arr.length);
        }
        if (
            files.dirs.length > 0 &&
            files.dirs.includes('src')
        ) {
            const zswj = join(url, this.config.gene);
            const ins = getImportUrl(
                join(this.getDirUrl(), this.config.gene),
                zswj,
            );
            this._indexUrls.push(`@use "${ins}" as *;`);
            const urs: string[] = [];
            for (const kurl of fileUrls) {
                if (kurl.startsWith(url)) {
                    const inv = getImportUrl(zswj, kurl);
                    urs.push(`@use "${inv}" as *;`);
                }
            }
            return urs;
        } else if (url == this.getDirUrl()) {
            return this._indexUrls;
        } else {
            return [];
        }
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangTheme(config);
    fang.runDev(callback, configCallback);
}
