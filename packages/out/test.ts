import {
    runDev as runDevOut,
    getGeneObj,
    getFileNeader,
} from './index';
import { join } from 'node:path';
import type { Config as ConfigOut } from './index';
import { unmergeObject } from '../common';
export interface Config extends ConfigOut {}

const defaultConfig: Config = {
    outDir: './tests/',
    /**
     * 是否替换原来配置
     */
    cover: false,
};
function setDefault(config: Config) {
    if (!config.gene) {
        config.gene = (name, url) => {
            const obj = getGeneObj(
                url,
                name,
                config.outDir + '',
            );
            return join(
                obj.catalogue,
                obj.name + '.test' + obj.suffix,
            );
        };
    }

    if (!config.fileSet) {
        config.fileSet = (name, url, _text, wjm, imp) => {
            return [
                ...getFileNeader(name, url),
                `import { test, expect } from 'vitest';`,
                `import { ${wjm} } from '${imp}';`,
                '',
                `test('${imp}', () => {`,
                `       //expect(${wjm}()).toBe();`,
                `});`,
            ];
        };
    }
    return config;
}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => Config | void,
) {
    config = unmergeObject(defaultConfig, config, 1);
    await runDevOut(config, (c) => {
        if (configCallback) {
            const v = configCallback(c);
            if (v) {
                return v;
            }
        }
        return setDefault(c);
    });
}
