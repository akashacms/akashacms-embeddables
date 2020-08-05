
const akasha   = require('akasharender');
const plugin = require('../index');
const { assert } = require('chai');

const config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
config.addLayoutsDir('layouts')
      .addPartialsDir('partials')
      .addDocumentsDir('documents');
config.use(plugin)
    .use(require('@akashacms/plugins-base'));
config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true,
    decodeEntities: true
});
config.prepare();


describe('build site', function() {
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
});
