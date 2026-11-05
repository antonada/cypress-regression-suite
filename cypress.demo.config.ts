import { defineConfig } from 'cypress';

// Used only by the "Record demo" workflow to produce the video in docs/media
const DEMO_TESTS = [
  'filters paid orders, opens one and marks it as shipped',
  'creates an order that shows up at the top of the list',
  'shows a first-run message when there are no orders at all',
  'offers to clear filters when a search finds nothing',
  'falls back to placeholders when the API leaves fields out',
  'shows an error on 500 and loads the list after "Try again"',
  'sends the user to sign in on 401 and brings them back afterwards',
  'keeps the old status and shows a toast when saving fails',
  'maps 422 validation errors from the server onto the form',
];

export default defineConfig({
  expose: {
    grep: DEMO_TESTS.join('; '),
    grepOmitFiltered: true,
  },
  e2e: {
    baseUrl: 'http://localhost:4173',
    viewportWidth: 1280,
    viewportHeight: 800,
    specPattern: ['cypress/e2e/workflows.cy.ts', 'cypress/e2e/empty-states.cy.ts', 'cypress/e2e/api-errors.cy.ts'],
    supportFile: 'cypress/support/demo.ts',
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
