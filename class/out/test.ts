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

export interface Config extends ConfigOut {}

const defaultConfig: Config = Object.assign(
    {},
    defaultConfigOut,
    {
        name: 'test',
        outDir: './tests/',
        /**
         * 是否替换原来配置
         */
        fileCover: false,
    },
);

export class FangTest extends FangOut {
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
            obj.name + '.test' + obj.suffix,
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
        // 引用路径
        imp?: string,
    ): string[] {
        return [
            ...this.getFileNeader(name, url),
            `import { test, expect } from 'vitest';`,
            `import { ${wjm} } from '${imp}';`,
            '',
            `test('${imp}', () => {`,
            `       //expect(${wjm}()).toBe();`,
            `});`,
        ];
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangTest(config);
    fang.runDev(callback, configCallback);
}
