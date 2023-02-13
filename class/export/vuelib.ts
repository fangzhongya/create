import { getImportUrlSuffix } from '@fangzhongya/utils/urls/getImportUrlSuffix';
import { getUrlCatalogueLast } from '@fangzhongya/utils/urls/getUrlCatalogueLast';
import { lineToLargeHump } from '@fangzhongya/utils/name/lineToLargeHump';
import { resolve, join } from 'node:path';
import {
    defaultConfig as defaultConfigExport,
    FangExport,
} from '../export';

import type { Config as ConfigExport } from '../export';
import type {
    RurDevCallback,
    ConfigCallback,
    FsReaddir,
} from '../com';

export interface Config extends ConfigExport {
    /**
     * 公共方法dir后的路径
     */
    utilurl?: string | ((a: string) => string);

    /**
     * 替换头的完整路径
     */
    dittop?: string;
    /**
     * 拼接头
     */
    splicetop?: string;
    /**
     * 文件地址
     */
    liburl?: string;
    /**
     * 分割线
     */
    branch?: string;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigExport,
    {
        name: 'vue',
        /**
         * 合并文件头
         */
        utilurl: 'util.ts',
        dir: './src/components/',
        extensions: ['vue'],
        gene: 'index.ts',
        matchexts: [/[\\|\/]src[\\|\/]index\.vue$/],
        branch: '/',
        fileTop(_url: string, _files: FsReaddir) {
            return [] as string[];
        },
        fileDirs(
            _url: string,
            _files: FsReaddir,
            _name: string,
        ) {
            return [] as string[];
        },
        fileFile(
            _url: string,
            _files: FsReaddir,
            _name: string,
            _wjmc: string,
        ) {
            return [] as string[];
        },
        fileEnd(
            _url: string,
            _files: FsReaddir,
            _name: Array<string>,
        ) {
            return [] as string[];
        },
    },
);

export class FangVueLib extends FangExport {
    _indexUrls: string[];
    _libObj: {
        [key: string]: string;
    };
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this._indexUrls = [];
        this._libObj = {};
        this.config = {};
        this._configCallback = callback;
        defaultConfig.liburl = resolve(
            process.cwd(),
            'build.lib.ts',
        );
        defaultConfig.fileEnd = (
            url: string,
            files: FsReaddir,
            arr?: Array<string> | string,
        ) => {
            return this.setFileEnd(
                url,
                files,
                arr as string[],
            );
        };
        this._defaultConfig = defaultConfig;
        this.initConfig(config);
    }
    setFileEnd(
        url: string,
        files: FsReaddir,
        arr: Array<string>,
    ) {
        if (arr instanceof Array) {
            arr.splice(0, arr.length);
        }
        if (
            files.dirs.length > 0 &&
            files.dirs.includes('src')
        ) {
            const mlz = getUrlCatalogueLast(url);
            const key = url
                .replace(this.config.dittop, '')
                .substring(1)
                .replace(/[\\|\/]/g, this.config.branch);
            this._libObj[key] = join(
                this.config.splicetop,
                mlz,
            ).replace(/[\\|\/]/g, this.config.branch);
            const zswj = join(url, this.config.gene);
            let iu;
            if (typeof this.config.utilurl == 'function') {
                iu = this.config.utilurl(zswj);
            } else {
                iu = getImportUrlSuffix(
                    zswj,
                    join(
                        this.getDirUrl(),
                        this.config.utilurl,
                    ),
                );
            }
            const ins = getImportUrlSuffix(
                join(this.getDirUrl(), this.config.gene),
                zswj,
            );
            this._indexUrls.push(`export * from '${ins}';`);

            const name = lineToLargeHump(mlz);
            return [
                `import { withInstall } from '${iu}'`,
                `import SrcVue from './src/index.vue'`,
                `export const ${name} = withInstall(SrcVue, '${name}');`,
                `export default ${name};`,
            ];
        } else if (url == this.getDirUrl()) {
            return this._indexUrls;
        } else {
            return [];
        }
    }
    async runDev(
        callback?: RurDevCallback | undefined,
        config?: Config | undefined,
        configCallback?: ConfigCallback | undefined,
    ) {
        await super.runDev(
            callback,
            config,
            configCallback,
        );
        const arr = ['export const create = '];
        arr.push(JSON.stringify(this._libObj, null, 4));
        arr.push(';');
        this.fileOpen(this.config.liburl, arr.join('\n'));
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangVueLib(config);
    fang.runDev(callback, configCallback);
}
