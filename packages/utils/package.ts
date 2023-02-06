import { runDev as packageRunDev } from '../package-export';
import { writeCallback, initConfig } from './index';
import type { RurDevCallback } from '../common';
import type { Config as ConfigIndex } from './index';
import type { Config as ConfigPackage } from '../package-export';

export interface Config
    extends ConfigPackage,
        ConfigIndex {}

export async function runDev(
    config: Config = {},
    configCallback?: (config: Config) => Config | void,
    callback?: RurDevCallback,
) {
    await packageRunDev(
        config,
        (defaultConfig) => {
            const c = initConfig(defaultConfig);
            if (configCallback) {
                const v = configCallback(c);
                if (v) {
                    return v;
                }
            } else {
                return c;
            }
        },
        (...arr) => {
            if (callback) {
                callback(...arr);
            }
            writeCallback(...arr);
        },
    );
}
