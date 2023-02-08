import {
    runDev as runDevOut,
    getFileNeader,
} from './index';
import type { Config as ConfigOut } from './index';
import { unmergeObject } from '../common';
export interface Config extends ConfigOut {
    /**
     * 提出单位
     */
    unit?: string;
    /**
     * 处理函数
     */
    handle?: (n: number) => string;
}

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

    /**
     * 提出单位
     */
    unit: 'rem',
    /**
     * 处理函数
     */
    handle(n) {
        //px 转 rpx
        return (
            Math.ceil(
                (Number((n * 108).toFixed(0)) * 750) / 1080,
            ) + 'rpx'
        );
    },
};

export function setCss(
    text: string,
    str: string = 'rem',
    callback?: (n: number) => string,
): string {
    const reg = new RegExp(
        `(\\d+${str})|(\\d+\\.\\d+${str})|(\\.\\d+${str})|(-\\d+${str})|(-\\d+\\.\\d+${str})`,
        'g',
    );
    return text.replace(reg, function (v) {
        if (callback) {
            return callback(parseFloat(v));
        }
        return v + 'str';
    });
}

function setDefault(config: Config) {
    if (!config.fileSet) {
        config.fileSet = (name, url, text) => {
            return [
                ...getFileNeader(name, url),
                setCss(
                    text,
                    config.unit || defaultConfig.unit,
                    config.handle || defaultConfig.handle,
                ),
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
