import {
    defaultConfig as defaultConfigUitle,
    FangUitle,
} from './utils';

import {
    defaultConfig as defaultConfigPackageExport,
    FangPackageExport,
} from '../package-export';

import type { Config as ConfigUitle } from './utils';
import type { Config as ConfigPackageExport } from '../package-export';
import type {
    RurDevCallback,
    ConfigCallback,
} from '../com';

export interface Config
    extends ConfigUitle,
        ConfigPackageExport {}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigUitle,
    defaultConfigPackageExport,
    {},
);

export class FangExportPackageExport extends FangPackageExport {
    _Uitle: FangUitle;
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super(config, callback);
        this.setDefaultConfig(defaultConfig);
        this._Uitle = new FangUitle(this.config);
    }
    runDev(
        callback?: RurDevCallback | undefined,
        configCallback?: ConfigCallback | undefined,
        _config?: Config | undefined,
    ) {
        return super.runDev(
            (...arr) => {
                if (callback) {
                    callback(...arr);
                }
                this._Uitle.writeCallback(...arr);
            },
            (c) => {
                c = this._Uitle.initConfig(c);
                if (configCallback) {
                    const v = configCallback(c);
                    if (v) {
                        return this._Uitle.initConfig(v);
                    }
                }
                return c;
            },
        );
    }
}
export function runDev(
    config: Config = {},
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangExportPackageExport(config);
    fang.runDev(callback, configCallback);
}
