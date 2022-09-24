
const akasha   = require('akasharender');
const plugin = require('../index');
const { assert } = require('chai');

let config;

describe('build site', function() {

    it('should construct configuration', async function() {
        this.timeout(75000);
        config = new akasha.Configuration();
        config.rootURL("https://example.akashacms.com");
        config.configDir = __dirname;
        config.setConcurrency(1);
        config.addLayoutsDir('layouts')
              // .addPartialsDir('partials')
              .addDocumentsDir('documents');
        config.use(plugin)
            .use(require('@akashacms/plugins-base'));
        config.setMahabhutaConfig({
            recognizeSelfClosing: true,
            recognizeCDATA: true,
            decodeEntities: true
        });
        config.prepare();
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
