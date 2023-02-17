import {
    defaultConfig as defaultConfigExport,
    FangExport,
} from './export';

import {
    defaultConfig as defaultConfigPackage,
    FangPackage,
} from './package';

import type { Config as ConfigExport } from './export';
import type { Config as ConfigPackage } from './export';
import type { RurDevCallback, ConfigCallback } from './com';

export interface Config
    extends ConfigExport,
        ConfigPackage {}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigExport,
    defaultConfigPackage,
    { name: 'package-export' },
);

export class FangPackageExport extends FangPackage {
    _Export: FangExport;
    constructor(
        config?: Config,
        callback?: ConfigCallback,
    ) {
        super();
        this.config = {};
        this._configCallback = callback;
        this._defaultConfig = defaultConfig;
        this.initConfig(config || this.config);
        this._Export = new FangExport(this.config);
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
                this._Export.writeCallback(...arr);
            },
            (c) => {
                c = this._Export.initConfig(c);
                if (configCallback) {
                    const v = configCallback(c);
                    if (v) {
                        c = this._Export.initConfig(v);
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
    const fang = new FangPackageExport(config);
    fang.runDev(callback, configCallback);
}
