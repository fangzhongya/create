import { runDev } from '../export';
import { getImportUrlSuffix } from '@fangzhongya/utils/urls/getImportUrlSuffix';
import { getUrlCatalogueLast } from '@fangzhongya/utils/urls/getUrlCatalogueLast';
import { lineToLargeHump } from '@fangzhongya/utils/name/lineToLargeHump';
import { resolve, join } from 'node:path';
const utilurl = resolve(
    process.cwd(),
    './src/components/util.ts',
);

runDev({
    dir: './src/components/',
    extensions: ['vue'],
    gene: 'index.ts',
    matchexts: [/[\\|\/]src[\\|\/]index\.vue$/],
    fileEnd(url, file, arr) {
        if (arr instanceof Array) {
            arr.splice(0, arr.length);
        }
        if (
            file.dirs.length > 0 &&
            file.dirs.includes('src')
        ) {
            const iu = getImportUrlSuffix(
                join(url, 'index.ts'),
                utilurl,
            );
            const name = lineToLargeHump(
                getUrlCatalogueLast(url),
            );
            return [
                `import { withInstall } from '${iu}'`,
                `import SrcVue from './src/index.vue'`,
                `export const ${name} = withInstall(SrcVue, '${name}');`,
                `export default ${name};`,
            ];
        } else {
            return [];
        }
    },
});
