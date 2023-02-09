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
    { name: 'export-package' },
);

export class FangExportPackageExport extends FangPackageExport {
    _Uitle: FangUitle;
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this.config = {};
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config);
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
                        c = this._Uitle.initConfig(v);
                    }
                }
                this.initConfig(c);
            },
        );
    }
}
export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
    callback?: RurDevCallback,
) {
    const fang = new FangExportPackageExport(config);
    fang.runDev(callback, configCallback);
}
