

import akasha from 'akasharender';
import { EmbeddablesPlugin } from '../index.mjs';
import { BasePlugin } from '@akashacms/plugins-base';

const __dirname = import.meta.dirname;

const config = new akasha.Configuration();
config.rootURL("https://example.akashacms.com");
config.configDir = __dirname;
config.setConcurrency(1);
config.addLayoutsDir('layouts')
      // .addPartialsDir('partials')
      .addDocumentsDir('documents');
config.use(EmbeddablesPlugin)
    .use(BasePlugin);
config.setMahabhutaConfig({
    recognizeSelfClosing: true,
    recognizeCDATA: true,
    decodeEntities: true
});
config.prepare();

export default config;
