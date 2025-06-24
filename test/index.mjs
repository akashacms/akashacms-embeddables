
import akasha from 'akasharender';
import { assert } from 'chai';

const __dirname = import.meta.dirname;
import { default as config } from './config.mjs';

describe('build site', function() {

    it('should construct configuration', async function() {
        this.timeout(75000);
    });

    it('should run setup', async function() {
        this.timeout(75000);
        await akasha.setup(config);
    });

    it('should copy assets', async function() {
        this.timeout(75000);
        await config.copyAssets();
    });

    it('should build site', async function() {
        this.timeout(25000);
        let failed = false;
        // console.log(config.layoutDirs);
        // console.log(config.plugins);
        let results = await akasha.render(config);
        for (let result of results) {
            if (result.error) {
                failed = true;
                console.error(result.error);
            }
        }
        assert.isFalse(failed);
    });

    it('should close the configuration', async function() {
        this.timeout(75000);
        await akasha.closeCaches();
    });
});
