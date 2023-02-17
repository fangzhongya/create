import { runDev } from '@fangzhongya/create/package';

runDev({
    dir: './dist/',
    dist: 'dist',
    cover: true,
    extensions: ['js'],
    nomatchexts: [
        /\\chunk-([a-z|A-Z|0-9|-]+)\.js$/,
        '\\common.js',
        '\\com.js',
    ],
    exportsIndex: true,
    packageObj: {
        exports: {
            './*': './*',
        },
        typesVersions: {
            '*': {
                '*': ['./dist/*'],
            },
        },
    },
});
