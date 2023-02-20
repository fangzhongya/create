import { join } from 'node:path';
import {
    FangOut,
    defaultConfig as defaultConfigOut,
} from './index';
import type { Config as ConfigOut } from './index';
import { lineToLargeHump } from '@fangzhongya/utils/name/lineToLargeHump';
import type {
    RurDevCallback,
    ConfigCallback,
    FsReaddir,
} from '../com';

export interface Config extends ConfigOut {}

const defaultConfig: Config = Object.assign(
    {},
    defaultConfigOut,
    {
        name: 'svgvue',
        extensions: ['svg'],
        read: true,
        suffix: 'vue',
        outDir: './svgvue/',
    },
);

export class FangSvgVue extends FangOut {
    _indexUrls: string[];
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this.config = {};
        this._indexUrls = [];
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config || this.config);
    }
    /**
     * 获取输出地址方法
     * @param gene
     * @returns
     */
    getDefaultGene(name: string, url: string) {
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
    getFileNeader(
        name: string,
        url: string,
    ): Array<string> {
        return [
            `<!-- ${join(url, name).replace(
                /\\/g,
                '/',
            )} -->`,
        ];
    }
    getDefaultFileSet(
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
    ): string[] {
        const mc = lineToLargeHump(wjm || '');
        this._indexUrls.push(
            `export { default as ${mc} } from './${wjm}.vue'`,
        );
        return [
            ...this.getFileNeader(name, url),
            `<template>`,
            `   ${text}`,
            `</template>`,
            `<script lang="ts">`,
            `import type { DefineComponent } from 'vue';`,
            `export default {`,
            `   name: '${mc}',`,
            `} as DefineComponent`,
            `</script>`,
        ];
    }
    async runDev(
        callback?: RurDevCallback,
        configCallback?: ConfigCallback,
        config?: Config,
    ) {
        const arr = await super.runDev(
            callback,
            configCallback,
            config,
        );
        setTimeout(() => {
            this.fileOpen(
                join(
                    process.cwd(),
                    this.config.outDir,
                    './index.ts',
                ),
                this._indexUrls.join('\n'),
                [],
                0,
            );
        }, 100);
        return arr;
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangSvgVue(config);
    fang.runDev(callback, configCallback);
}
