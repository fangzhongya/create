import { runDev } from '../packages/package';
import { test, expect } from 'vitest';

test('package runDev', () => {
    runDev({
        matchexts: [/(?<!\/common.ts)$/],
    });
});
