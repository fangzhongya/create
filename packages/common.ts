import {
    open,
    readdir,
    stat,
    writeFile,
    write,
    mkdir,
    readFile,
} from 'node:fs';
import { join } from 'node:path';

/**
 * 合并两个对象的值
 * @param a 合并到的对象
 * @param b 合并对象
 * @param j 合并级别
 * @param i 是否合并数组
 * @returns 合并的对象
 */
export function mergeObject<T>(
    a: T,
    b: T,
    j: number = 0,
    i?: boolean,
): T {
    if (a instanceof Array) {
        if (j > 0 && i) {
            if (b instanceof Array) {
                for (const v of b) {
                    if (!a.includes(v)) {
                        a.push(v);
                    }
                }
            } else {
                if (!a.includes(b)) {
                    a.push(b);
                }
            }
        } else {
            a = b;
        }
    } else if (typeof a == 'object') {
        const cv = Object.prototype.toString.call(a);
        const ct = Object.prototype.toString.call(b);
        if (
            a &&
            typeof b == 'object' &&
            cv == ct &&
            j > 0
        ) {
            const n = j - 1;
            if (n > 0) {
                for (const key in b) {
                    const v = a[key];
                    const t = b[key];
                    a[key] = mergeObject(v, t, n, i);
                }
            } else {
                for (const key in b) {
                    a[key] = b[key];
                }
            }
        } else {
            a = b;
        }
    } else {
        a = b;
    }
    return a;
}

export interface FsReaddir {
    file: Array<string>;
    dirs: Array<string>;
}

export interface Objunkn {
    [key: string]: any;
}

/**
 * 读取文件内容
 */
export function fsReadFile(url: string): Promise<string> {
    return new Promise((resolve) => {
        readFile(url, 'utf-8', (err, dataStr) => {
            if (err) {
                console.log(err);
            }
            resolve(dataStr);
        });
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
                                console.log(err);
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
    callback?: () => void,
) {
    // 检查文件是否存在于当前目录，且是否可写。
    open(path, 'wx', (err, fd) => {
        if (err) {
            if (err.code === 'EEXIST') {
                writeFile(path, json, 'utf-8', (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if (callback) callback();
                    }
                });
            } else {
                console.log(err);
            }
        } else {
            write(fd, json, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    if (callback) callback();
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
    callback?: () => void,
) {
    // 不存在文件夹，直接创建 {recursive: true} 这个配置项是配置自动创建多个文件夹
    mkdir(reaPath, { recursive: true }, (err) => {
        if (err) {
            console.log(err);
        } else {
            if (callback) {
                callback();
            }
        }
    });
}

export function writeInit(
    url: string,
    callback?: (url: string, file: FsReaddir) => void,
): Promise<boolean> {
    return new Promise(async (resolve) => {
        if (url) {
            const data = await fsReaddir(url);
            await writeIndex(url, data, callback);
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

function writeIndex(
    url: string,
    file: FsReaddir,
    callback?: (url: string, file: FsReaddir) => void,
): Promise<boolean> {
    return new Promise(async (resolve) => {
        if (callback) {
            callback(url, file);
        }
        if (file.dirs.length > 0) {
            for (let i = 0; i < file.dirs.length; i++) {
                await writeInit(
                    join(url, file.dirs[i]),
                    callback,
                );
            }
        }
        resolve(true);
    });
}
