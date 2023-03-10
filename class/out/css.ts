import {
    FangOut,
    defaultConfig as defaultConfigOut,
} from './index';
import type { Config as ConfigOut } from './index';
import { fetchUnitValue } from '@fangzhongya/utils/css/fetchUnitValue';
import type {
    RurDevCallback,
    ConfigCallback,
} from '../com';

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

const defaultConfig: Config = Object.assign(
    {},
    defaultConfigOut,
    {
        name: 'css',
        outDir: './css/',
        /**
         * 文件后缀
         */
        extensions: ['css', 'scss'],
        /**
         * 是否覆盖以有的文件
         */
        fileCover: false,
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
        handle(n: number) {
            //px 转 rpx
            return (
                Math.ceil(
                    (Number((n * 108).toFixed(0)) * 750) /
                        1080,
                ) + 'rpx'
            );
        },
    },
);

export class FangCss extends FangOut {
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
    setCss(
        text: string,
        str: string,
        callback?: (
            n: number,
            dw: string,
            yss: string,
            w: number,
        ) => string,
    ): string {
        return fetchUnitValue(text, str, callback);
    }
    getDefaultFileSet(
        //文件名称
        name: string,
        //文件目录
        url: string,
        //文件内容
        text: string,
        // 文件名称，没有后缀的
        _wjm?: string,
        // 引用路径
        _imp?: string,
    ): string[] {
        return [
            ...this.getFileNeader(name, url),
            this.setCss(
                text,
                this.config.unit,
                this.config.handle,
            ),
        ];
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangCss(config);
    fang.runDev(callback, configCallback);
}
