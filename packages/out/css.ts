import {
    runDev as runDevOut,
    getFileNeader,
} from './index';
import type { Config as ConfigOut } from './index';
import { unmergeObject } from '../common';
export interface Config extends ConfigOut {}

const defaultConfig: Config = {
    outDir: './css/',
    /**
     * 文件后缀
     */
    extensions: ['css', 'scss'],
    /**
     * 是否覆盖以有的文件
     */
    cover: false,
    /**
     * 是否读取文件
     */
    read: true,
};
export function setCss(str: string): string {
    const reg =
        /(\d+rem)|(\d+\.\d+rem)|(\.\d+rem)|(-\d+rem)|(-\d+\.\d+rem)/g;

    return str.replace(reg, function (aaa) {
        //首先转px
        const pxVal = Number(
            (parseFloat(aaa) * 108).toFixed(0),
        );
        //px 转 rpx
        return Math.ceil((pxVal * 750) / 1080) + 'rpx';
    });
}
function setDefault(config: Config) {
    if (!config.fileSet) {
        config.fileSet = (name, url, text) => {
            return [
                ...getFileNeader(name, url),
                setCss(text),
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
