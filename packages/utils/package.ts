import { runDev as packageRunDev } from '../package-export';
import { writeCallback, main } from './index';
import type { Config as ConfigPackage } from '../package-export';
import type { Config as ConfigIndex } from './index';
import type { Objunkn, FsReaddir } from '../common';
export interface Config
    extends ConfigPackage,
        ConfigIndex {}

const initObj: Objunkn = {};

function initConfig(c: Config) {
    initObj.config = c;
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
            writeCallback(url, file);
            if (callback) {
                callback(url, file);
            }
        },
    );
    main();
}
