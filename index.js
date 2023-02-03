const packages = require('./dist/package');
packages.runDev({
    cover: true,
    tsup: {
        main: 'cjs',
        module: 'js',
        types: 'd.ts',
    },
});
