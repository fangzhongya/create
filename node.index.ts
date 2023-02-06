import { runDev } from '@fangzhongya/create/package';

runDev({
    cover: true,
    matchexts: [/(?<![\\|\/]common\.ts)$/],
    files: ['*.d.ts'],
    exports: {
        './*': './*',
    },
});
