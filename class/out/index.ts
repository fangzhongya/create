import { resolve, join } from 'node:path';
import { styleLog } from '@fangzhongya/utils/log/styleLog';
import { getReplaceUrl } from '@fangzhongya/utils/urls/getReplaceUrl';
import { getUrlCatalogueObj } from '@fangzhongya/utils/urls/getUrlCatalogueObj';

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
        outDir: './',
    } as Config,
);

export class FangOut extends FangFile {
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super(config, callback);
        this.setDefaultConfig(defaultConfig);
    }
    getFileNeader(
        name: string,
        url: string,
    ): Array<string> {
        return [
            `/**`,
            ` * ${join(url, name).replace(/\\/g, '/')}`,
            ` * ${new Date().toString()}`,
            ' */',
        ];
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
    getLogs(type = 'out', c = 6) {
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
    const fang = new FangOut(config);
    fang.runDev(callback, configCallback);
}
