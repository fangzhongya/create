import { runDev } from '@fangzhongya/create/package';

runDev({
    dir: './dist/',
    dist: 'dist',
    cover: true,
    upversion: true,
    extensions: ['js'],
    nomatchexts: [
        /\\chunk-([a-z|A-Z|0-9|-]+)\.js$/,
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
