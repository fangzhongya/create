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
        this.initConfig(config);
    }
    // function setCss(text, str = 'rem') {
    //     text = text.replace(/\s/g, '  ');
    //     const reg = new RegExp(
    //         `\\s*(\\.|-|:|\\s|\\n|\\r|\\()([0-9\\.]+)(${str})(\\n|\\r|\\s|;|\\)|\\})`,
    //         'g',
    //     );
    //     text = text.replace(reg, function (a, b, c,d) {
    //         let th = c+d;
    //         if(b == '.'){
    //             c = '0.'+c;
    //             th = b + th;
    //         }
    //         console.log('th', th);
    //         return a.replace(th, "100rpx")
    //     });
    //     return text.replace(/\s\s/g, ' ');
    // }
    setCss(
        text: string,
        str: string,
        callback?: (
            n: number,
            dw: string,
            yss: string,
        ) => string,
    ): string {
        text = text.replace(/ /g, '  ');
        const reg = new RegExp(
            `\\s*(\\.|-|:|\\s|\\n|\\r|\\()([0-9\\.]+)(${str})(\\n|\\r|\\s|;|\\)|\\})`,
            'g',
        );
        text = text.replace(reg, function (a, b, c, d) {
            let th = c + d;
            if (b == '.') {
                th = b + th;
            }
            let thv = th;
            const s = Number(c);
            if (callback && !isNaN(s)) {
                thv = callback(s, d, th);
            }
            return a.replace(th, thv);
        });
        return text.replace(/  /g, ' ');
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
