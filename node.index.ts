import { runDev } from '@fangzhongya/create/package';

runDev({
    matchexts: [/(?<![\/|\\]common.ts)$/],
});
