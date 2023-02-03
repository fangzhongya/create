import { runDev as packageRunDev } from './package';
import { writeCallback } from './export';
import type { Config as ConfigPackage } from './package';
import type { Config as ConfigExport } from './export';
import type { Objunkn, FsReaddir } from './common';

export interface Config
    extends ConfigPackage,
        ConfigExport {}

const initObj: Objunkn = {};

export function initConfig(config: Config) {
    initObj.config = config;
}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => void,
    callback?: (url: string, file: FsReaddir) => void,
) {
    await packageRunDev(
        config,
        (defaultConfig) => {
            initConfig(defaultConfig);
            if (configCallback) {
                configCallback(initObj.config);
            }
        },
        (url: string, file: FsReaddir) => {
            writeCallback(initObj.config.gene, url, file);
            if (callback) {
                callback(url, file);
            }
        },
    );
}
