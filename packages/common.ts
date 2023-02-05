import {
    open,
    readdir,
    stat,
    writeFile,
    write,
    mkdir,
    readFile,
    access,
    constants,
} from 'node:fs';
import { join } from 'node:path';

import { styleLog } from '@fangzhongya/utils/log/styleLog';

import { mergeObject } from '@fangzhongya/utils/basic/object/mergeObject';
import { unmergeObject } from '@fangzhongya/utils/basic/object/unmergeObject';

export { styleLog, mergeObject, unmergeObject };

export interface FsReaddir {
    file: Array<string>;
    dirs: Array<string>;
}

export interface Objunkn {
    [key: string]: any;
}

export type FsOpenCallback = (
    path: string,
    type: number,
    is: boolean,
) => void;

export type RurDevCallback = (
    url: string,
    file: FsReaddir,
    urls: Array<string>,
) => void;

export type IsMatch = (
    url: string,
    name: string,
) => boolean;
/**
 * 读取文件内容
 */
export function fsReadFile(url: string): Promise<string> {
    return new Promise((resolve) => {
        readFile(url, 'utf-8', (err, dataStr) => {
            if (err) {
                console.log('2', err);
            }
            resolve(dataStr);
        });
    });
}

// 传入文件夹的路径看是否存在，存在不用管，不存在则直接创建文件夹
/**
 * 判断文件夹是否存在，不存在可以直接创建
 * @param reaPath {String} 文件路径
 * @returns {Promise<boolean>}
 */
export function fsAccess(
    reaPath: string,
): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            access(reaPath, constants.F_OK, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        } catch (e) {
            resolve(false);
        }
    });
}

export function fsReaddir(
    filePath: string,
): Promise<FsReaddir> {
    return new Promise((resolve, reject) => {
        //根据文件路径读取文件，返回文件列表
        readdir(filePath, (err, files) => {
            if (err) {
                reject(err);
            } else {
                const lg = files.length;
                const dirs: Array<string> = [];
                const file: Array<string> = [];
                if (lg) {
                    let i = 0;
                    //遍历读取到的文件列表
                    files.forEach((filename) => {
                        //获取当前文件的绝对路径
                        const filedir = join(
                            filePath,
                            filename,
                        );
                        //根据文件路径获取文件信息，返回一个fs.Stats对象
                        stat(filedir, (err, stats) => {
                            i++;
                            if (err) {
                                console.log('4', err);
                            } else {
                                const isFile =
                                    stats.isFile(); //是文件
                                const isDir =
                                    stats.isDirectory(); //是文件夹
                                if (isFile) {
                                    file.push(filename);
                                }
                                if (isDir) {
                                    dirs.push(filename);
                                }
                            }
                            if (i >= lg) {
                                resolve({
                                    file,
                                    dirs,
                                });
                            }
                        });
                    });
                } else {
                    resolve({
                        file,
                        dirs,
                    });
                }
            }
        });
    });
}

/**
 * 异步地打开文件。详见 open(2)。 flags 可以是：
 * 以写入模式打开文件。文件会被创建（如果文件不存在）或截断（如果文件存在）。
 * @param {*} path
 * @param {*} json
 * @param {*} callback
 */
export function fsOpen(
    path: string,
    json: string,
    callback?: FsOpenCallback,
) {
    // 检查文件是否存在于当前目录，且是否可写。
    open(path, 'wx', (err, fd) => {
        if (err) {
            if (err.code === 'EEXIST') {
                writeFile(path, json, 'utf-8', (err) => {
                    if (err) {
                        console.log('6', err);
                        if (callback)
                            callback(path, 2, false);
                    } else {
                        if (callback)
                            callback(path, 2, true);
                    }
                });
            } else {
                if (callback) callback(path, 0, false);
            }
        } else {
            write(fd, json, (err) => {
                if (err) {
                    console.log('8', err);
                    if (callback) callback(path, 1, false);
                } else {
                    if (callback) callback(path, 1, true);
                }
            });
        }
    });
}
// 传入文件夹的路径看是否存在，存在不用管，不存在则直接创建文件夹
/**
 * 判断文件夹是否存在，不存在可以直接创建
 * @param reaPath {String} 文件路径
 * @returns {Promise<boolean>}
 */
export function fsMkdir(
    reaPath: string,
    callback?: (
        reaPath: string,
        is: boolean,
        p?: string,
    ) => void,
) {
    // 不存在文件夹，直接创建 {recursive: true} 这个配置项是配置自动创建多个文件夹
    mkdir(reaPath, { recursive: true }, (err, path) => {
        if (err) {
            console.log('0', err);
            if (callback) {
                callback(reaPath, false);
            }
        } else {
            if (callback) {
                callback(reaPath, true, path);
            }
        }
    });
}

/**
 * 当前目录文件地址
 * @param url 文件目录地址
 * @param callback 执行回调方法
 * @returns
 */
export function writeInit(
    url: string,
    callback?: RurDevCallback,
    isDirs?: IsMatch,
    isFile?: IsMatch,
): Promise<Array<string>> {
    return new Promise(async (resolve) => {
        if (url) {
            const data = await fsReaddir(url);
            const arr = await writeFileUrl(
                url,
                data,
                callback,
                isDirs,
                isFile,
            );
            resolve(arr);
        } else {
            resolve([]);
        }
    });
}

/**
 * 读取子目录
 * @param url
 * @param file
 * @param callback
 * @returns
 */
function writeFileUrl(
    url: string,
    files: FsReaddir,
    callback?: RurDevCallback,
    isDirs?: IsMatch,
    isFile?: IsMatch,
): Promise<Array<string>> {
    return new Promise(async (resolve) => {
        const arr: Array<string> = [];
        const dirs: Array<string> = [];
        if (files.dirs.length > 0) {
            for (let i = 0; i < files.dirs.length; i++) {
                const dir = files.dirs[i];
                let is = true;
                if (isDirs) {
                    is = isDirs(url, dir);
                }
                if (is) {
                    dirs.push(dir);
                    const urls = await writeInit(
                        join(url, dir),
                        callback,
                        isDirs,
                        isFile,
                    );
                    arr.push(...urls);
                }
            }
        }
        files.dirs = dirs;
        const file: Array<string> = [];
        if (files.file.length > 0) {
            files.file.forEach((name) => {
                let is = true;
                if (isFile) {
                    is = isFile(url, name);
                }
                if (is) {
                    file.push(name);
                    arr.push(join(url, name));
                }
            });
        }
        files.file = file;
        if (callback) {
            callback(url, files, arr);
        }
        resolve(arr);
    });
}

export function getSuffixReg(
    ex: Array<string> = [],
    mr?: Array<string>,
) {
    if (ex.length == 0) {
        if (mr) {
            ex.push(...mr);
        }
    }
    return new RegExp(`\\.(${ex.join('|')})$`);
}

export function isMatchs(
    key: string,
    matchs?: Array<string | RegExp>,
): boolean {
    if (matchs && matchs.length > 0) {
        for (const value of matchs) {
            if (typeof value == 'string') {
                if (key.startsWith(value)) {
                    return true;
                }
            } else {
                if (value.test(key)) {
                    return true;
                }
            }
        }
        return false;
    } else {
        return true;
    }
}

export function isMatchexts(
    key: string,
    matchs?: Array<string | RegExp>,
): boolean {
    if (matchs && matchs.length > 0) {
        for (const value of matchs) {
            if (typeof value == 'string') {
                if (key.endsWith(value)) {
                    return true;
                }
            } else {
                if (value.test(key)) {
                    return true;
                }
            }
        }
        return false;
    } else {
        return true;
    }
}
