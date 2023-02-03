import { runDev as packageRunDev } from './package';
import { writeCallback, initConfig } from './export';
import type { Config as ConfigPackage } from './package';
import type { Config as ConfigExport } from './export';
import type { RurDevCallback } from './common';

export interface Config
    extends ConfigPackage,
        ConfigExport {}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => void,
    callback?: RurDevCallback,
) {
    await packageRunDev(
        config,
        (defaultConfig) => {
            const c = initConfig(defaultConfig);
            if (configCallback) {
                configCallback(c);
            }
        },
        (...arr) => {
            writeCallback(...arr);
            if (callback) {
                callback(...arr);
            }
        },
    );
}
