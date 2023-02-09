import { getImportUrlSuffix } from '@fangzhongya/utils/urls/getImportUrlSuffix';
import { getUrlCatalogueLast } from '@fangzhongya/utils/urls/getUrlCatalogueLast';
import { lineToLargeHump } from '@fangzhongya/utils/name/lineToLargeHump';

import { styleLog } from '@fangzhongya/utils/log/styleLog';
import { join } from 'node:path';
import {
    defaultConfig as defaultConfigExport,
    FangExport,
} from '../export';

import type {
    Config as ConfigExport,
    FileDatas,
} from '../export';
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
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super(config, callback);
        defaultConfig.fileEnd = this
            .setFileEnd as FileDatas;
        this.setDefaultConfig(defaultConfig);
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
            const iu = getImportUrlSuffix(
                join(url, this.config.gene),
                join(this.getDirUrl(), this.config.utilurl),
            );
            const name = lineToLargeHump(
                getUrlCatalogueLast(url),
            );
            return [
                `import { withInstall } from '${iu}'`,
                `import ${name} from './src/index.vue'`,
                `export const ${name} = withInstall(${name}, '${name}');`,
                `export default ${name};`,
            ];
        } else {
            return [];
        }
    }
    getLogs(type = 'vue', c = 2) {
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
    const fang = new FangVue(config);
    fang.runDev(callback, configCallback);
}
