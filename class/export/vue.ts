import { getImportUrlSuffix } from '@fangzhongya/utils/urls/getImportUrlSuffix';
import { getUrlCatalogueLast } from '@fangzhongya/utils/urls/getUrlCatalogueLast';
import { lineToLargeHump } from '@fangzhongya/utils/name/lineToLargeHump';

import { join } from 'node:path';
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
     * 合并文件头
     */
    utilurl?: string;
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

export class FangVue extends FangExport {
    _indexUrls: string[];
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this._indexUrls = [];
        this.config = {};
        this._configCallback = callback;
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
        this.initConfig(config || this.config);
    }
    setFileEnd(
        url: string,
        files: FsReaddir,
        arr: Array<string>,
    ) {
        if (
            files.dirs.length > 0 &&
            files.dirs.includes('src')
        ) {
            const zswj = join(url, this.config.gene);
            const iu = getImportUrlSuffix(
                zswj,
                join(this.getDirUrl(), this.config.utilurl),
            );
            const ins = getImportUrlSuffix(
                join(this.getDirUrl(), this.config.gene),
                zswj,
            );
            this._indexUrls.push(`export * from '${ins}';`);
            const name = lineToLargeHump(
                getUrlCatalogueLast(url),
            );
            return [
                `import { withInstall } from '${iu}'`,
                `import SrcVue from './src/index.vue'`,
                `export const ${name} = withInstall(SrcVue, '${name}');`,
                `export default ${name};`,
            ];
        } else if (url == this.getDirUrl()) {
            return this._indexUrls;
        } else {
            if (arr instanceof Array) {
                arr.splice(0, arr.length);
            }
            return [];
        }
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangVue(config);
    fang.runDev(callback, configCallback);
}
