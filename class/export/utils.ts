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

interface IssObj {
    name: string;
    url: string;
}

export interface Config extends ConfigExport {
    /**
     * 合并文件头
     */
    merge?: Array<string>;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigExport,
    {
        name: 'utils',
        /**
         * 合并文件头
         */
        merge: ['is'],
    },
);

export class FangUitle extends FangExport {
    _initObj: {
        [key: string]: Array<IssObj>;
    };
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this._initObj = {};
        this.config = {};
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config);
    }
    initConfig(config?: Config): Config {
        this._initObj = this._initObj || {};
        super.initConfig(config);
        const merge: Array<string> = this.config.merge;
        if (merge) {
            merge.forEach((key) => {
                this._initObj[key + 's'] =
                    [] as Array<IssObj>;
            });
        }
        return this.config;
    }
    async writeCallback(
        url: string,
        readdir: FsReaddir,
        fileUrls: string[],
    ) {
        super.writeCallback(url, readdir, fileUrls);
        if (readdir.file.length) {
            const merge: Array<string> = this.config.merge;
            readdir.file.forEach((name: string) => {
                const wjmc = this.getFileName(name);
                merge.forEach((key) => {
                    const reg = new RegExp(
                        `^(${key})[A-Z]([a-z|A-Z])+?$`,
                    );
                    const rex = reg.exec(wjmc);
                    if (rex && rex.length > 0) {
                        const sk = rex[1] + 's';
                        this._initObj[sk].push({
                            name: wjmc,
                            url,
                        });
                    }
                });
            });
        }
        if (url == this.getDirUrl()) {
            const add = await this.mainHandle(fileUrls);
            readdir.dirs.push(...add);
        }
    }
    async mainHandle(urls?: Array<string>) {
        const merge: Array<string> = this.config.merge;
        const add: Array<string> = [];
        merge.forEach((key) => {
            let arr = this._initObj[key + 's'];
            if (arr.length > 0) {
                const dirUrl = this.getDirUrl();
                const sts: Array<string> = [];
                arr.forEach((data: IssObj) => {
                    const ust = data.url
                        .replace(dirUrl, '')
                        .replace(/\\/g, '/');
                    sts.push(
                        `export * from '..${
                            ust + '/' + data.name
                        }';`,
                    );
                });
                const issurl = join(dirUrl, key + 's');
                const ssurl = join(
                    issurl,
                    this.config.gene,
                );
                this.fileOpen(ssurl, sts.join('\n'), urls);
                add.push(key + 's');
            }
        });
        return add;
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangUitle(config);
    fang.runDev(callback, configCallback);
}
