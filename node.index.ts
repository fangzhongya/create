import { runDev } from '@fangzhongya/create/package';

runDev({
    dir: './class/',
    cover: true,
    // matchexts: [/(?<![\\|\/]common\.ts)$/],
    nomatchexts: ['\\common.ts', '\\com.ts'],
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
