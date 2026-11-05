import { defineConfig } from 'cypress';
import { plugin as grepPlugin } from '@cypress/grep/plugin';
import mochawesomePlugin from 'cypress-mochawesome-reporter/plugin';

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'Orderly regression report',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
  },
  e2e: {
    baseUrl: 'http://localhost:4173',
    viewportWidth: 1280,
    viewportHeight: 800,
    retries: { runMode: 1, openMode: 0 },
    video: false,
    setupNodeEvents(on, config) {
      mochawesomePlugin(on);
      grepPlugin(config);
      return config;
    },
  },
});
