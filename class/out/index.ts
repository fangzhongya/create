import { join } from 'node:path';

import {
    defaultConfig as defaultConfigFile,
    FangFile,
} from '../file';
import type { Config as ConfigFile } from '../file';
import type {
    RurDevCallback,
    ConfigCallback,
} from '../com';

export interface Config extends ConfigFile {
    /**
     * 输出文件目录
     */
    outDir?: string;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigFile,
    {
        name: 'out',
        outDir: './',
    },
);

export class FangOut extends FangFile {
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
    getFileNeader(
        name: string,
        url: string,
    ): Array<string> {
        return [
            `/**`,
            ` * ${join(url, name).replace(/\\/g, '/')}`,
            ' */',
        ];
    }
    /**
     * 获取输出地址方法
     * @param gene
     * @returns
     */
    getDefaultGene(
        name: string,
        url: string,
        _wj?: string,
    ) {
        const obj = this.getGeneObj(
            url,
            name,
            this.config.outDir,
        );
        return join(obj.catalogue, obj.name + obj.suffix);
    }
    getDefaultFileSet(
        //文件名称
        name: string,
        //文件目录
        url: string,
        //文件内容
        _text: string,
        // 文件名称，没有后缀的
        _wjm?: string,
        // 引用路径
        _imp?: string,
    ) {
        return [...this.getFileNeader(name, url)];
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangOut(config);
    fang.runDev(callback, configCallback);
}
