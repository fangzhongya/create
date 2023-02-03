import { runDev } from '../packages/package';
import { test, expect } from 'vitest';

test('FangComponent', () => {
    runDev({
        cover: true,
        tsup: {
            main: 'cjs',
            module: 'js',
            types: 'd.ts',
        },
    });
});
