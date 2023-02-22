import {
    FangCom,
    ConfigCallback,
    defaultConfig as defaultConfigCom,
} from '../com';

import type {
    RurDevCallback,
    Config as ConfigCom,
} from '../com';

export interface Config extends ConfigCom {
    /**
     * package 文件名称
     */
    package?: string;
}

export const defaultConfig: Config = Object.assign(
    {},
    defaultConfigCom,
    {
        name: 'md',
    },
);

export class FangMd extends FangCom {
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
    writeCallback() {}
}

export function runDev(
    config?: Config,
    configCallback?: ConfigCallback,
) {
    return new FangMd(config, configCallback);
}
