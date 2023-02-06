import { runDev } from '@fangzhongya/create/package';

runDev({
    matchexts: [/(?<![\\|\/]common\.ts)$/],
});

// import { runDev } from '@fangzhongya/create/tests';

// runDev({});
