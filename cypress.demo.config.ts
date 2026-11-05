import { defineConfig } from 'cypress';

// Used only by the "Record demo" workflow to produce the video in docs/media
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4173',
    viewportWidth: 1280,
    viewportHeight: 800,
    specPattern: ['cypress/e2e/workflows.cy.ts', 'cypress/e2e/empty-states.cy.ts', 'cypress/e2e/api-errors.cy.ts'],
    video: true,
    videoCompression: false,
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          launchOptions.args.push('--window-size=1600,1000', '--force-device-scale-factor=1');
        }
        return launchOptions;
      });
    },
  },
});
