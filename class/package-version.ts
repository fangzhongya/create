import { resolve } from 'node:path';
import { fsReadFile } from './common';

import {
    FangCom,
    ConfigCallback,
    defaultConfig as defaultConfigCom,
} from './com';

import type {
    RurDevCallback,
    Config as ConfigCom,
} from './com';

interface ObjUnkn {
    [key: string]: any;
}

export interface Config extends ConfigCom {
    /**
     * package 文件名称
     */
    package?: string;
    /**
     * 版本号更新
     */
    upversion?: boolean;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigCom,
    {
        name: 'packageVersion',

        upversion: true,
        /**
         * package 文件名称
         */
        package: './package.json',
    },
);

export class FangPackageVersion extends FangCom {
    _packageObj: ObjUnkn;
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this._packageObj = {};
        this.config = {};
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config || this.config);
    }
    /**
     * 获取package 配置对象
     */
    async getPackageObj(pac?: string) {
        const packageUrl = this.getPackageUrl(pac);
        if (packageUrl) {
            const st = await fsReadFile(packageUrl);
            if (st) {
                this._packageObj = JSON.parse(st);
            }
            return this._packageObj;
        } else {
            return {};
        }
    }
    writeCallback() {}

    upVersion() {
        if (this.config.upversion) {
            const pv: string =
                this._packageObj.version || '0.0.0';
            const pvs = pv.split('.');
            for (; pvs.length < 3; ) {
                pvs.push('0');
            }
            const nl = pvs.length - 1;
            const wb = pvs[nl];
            const reg = /([0-9]+)$/g;
            const regs = reg.exec(wb);
            if (regs && regs.length > 0) {
                const sl = Number(regs[1]) + 1;
                const reg1 = new RegExp(regs[1] + '$');
                pvs[nl] = wb.replace(
                    reg1,
                    (sl + '').padStart(regs[1].length, '0'),
                );
            } else {
                pvs[nl] = wb + '1';
            }
            this._packageObj.version = pvs.join('.');
        }
    }

    async runDev(
        _callback?: RurDevCallback,
        configCallback?: ConfigCallback,
        config?: Config,
    ) {
        this.initConfig(config);
        await this.getPackageObj();

        const call = configCallback || this._configCallback;
        if (call) {
            const c = call(this.config);
            if (c) {
                this.initConfig(c);
            }
        }

        this.upVersion();

        this.setPackageJoon(this._packageObj);

        return undefined;
    }

    getPackageUrl(_dir?: string) {
        return resolve(
            process.cwd(),
            _dir || this.config.package,
        );
    }
    /**
     * 生成文件
     * @param v
     * @param pac
     */
    setPackageJoon(v: Object, pac?: string) {
        const packageUrl = this.getPackageUrl(pac);
        this.fileOpen(
            packageUrl,
            JSON.stringify(v, null, 4),
            undefined,
            0,
        );
    }
}

export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangPackageVersion(
        config,
        configCallback,
    );
    fang.runDev(callback);
}
