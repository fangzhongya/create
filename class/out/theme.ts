import { join } from 'node:path';
import {
    FangOut,
    defaultConfig as defaultConfigOut,
} from './index';
import type { Config as ConfigOut } from './index';
import type {
    RurDevCallback,
    ConfigCallback,
} from '../com';

export interface Config extends ConfigOut {
    suffix?: string;
    alias?: string;
    filter?: {
        [key: string]: string;
    };
}

const defaultConfig: Config = Object.assign(
    {},
    defaultConfigOut,
    {
        name: 'theme',
        outDir: './theme/',

        suffix: 'scss',
        matchexts: [/[\\|\/]src[\\|\/]([^\\|\/]+)\.vue$/],
        /**
         * 是否替换原来配置
         */
        fileCover: false,
    },
);

const regmc = /[\\|\/]([^\\|\/]+)[\\|\/]src$/;

export class FangTheme extends FangOut {
    _filters: string[];
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this.config = {};
        this._filters = [];
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config || this.config);
        this._filters = Object.keys(this.config.filter);
    }

    getfilterUrl(url: string) {
        url = url
            .replace(this.getDirUrl(), '')
            .replace(/[\\|\/]/g, '/')
            .substring(1);
        for (
            let index = 0;
            index < this._filters.length;
            index++
        ) {
            const element = this._filters[index];
            if (url.startsWith(element)) {
                return url.replace(
                    element,
                    this.config.filter[element],
                );
            }
        }
        return url;
    }
    /**
     * 获取输出地址方法
     * @param gene
     * @returns
     */
    getDefaultGene(name: string, url: string) {
        if (this.config.filter) {
            url = join(
                this.getDirUrl(),
                this.getfilterUrl(url),
            );
        }
        const obj = this.getGeneObj(
            url,
            name,
            this.config.outDir + '',
        );

        return join(
            obj.catalogue,
            obj.name + '.' + this.config.suffix,
        );
    }
    getDefaultFileSet(
        //文件名称
        name: string,
        //文件目录
        url: string,
        //文件内容
        _text: string,
        // 文件名称，没有后缀的
        wjm?: string,
    ): string[] {
        const arr = regmc.exec(url);
        if (arr && arr.length > 0) {
            if (name == 'index.vue') {
                wjm = arr[1];
            } else {
                wjm =
                    arr[1] +
                    '-' +
                    wjm?.replace(/\.vue$/, '');
            }
        } else {
            wjm = wjm?.replace(/\.vue$/, '');
        }
        if (this.config.alias) {
            wjm = this.config.alias + '-' + wjm;
        }
        return [
            ...this.getFileNeader(name, url),
            `.${wjm} {`,
            '   ',
            `}`,
        ];
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
