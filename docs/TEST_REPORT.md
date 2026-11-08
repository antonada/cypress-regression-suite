# Test report

Latest full run on GitHub Actions. The HTML reports for each browser are published at
https://antonada.github.io/cypress-regression-suite/, and all runs are on the
[Actions page](https://github.com/antonada/cypress-regression-suite/actions/workflows/cypress.yml).

## Summary

|              |                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------- |
| Date         | 8 November 2026                                                                               |
| Commit       | `5a9166c`                                                                                     |
| CI run       | [#42493947854](https://github.com/antonada/cypress-regression-suite/actions/runs/42493947854) |
| Environment  | GitHub Actions, `ubuntu-26.04`, Cypress 16.2, Node 22 for the app                             |
| Result       | **150 passed** (50 tests in 3 browsers), 0 failed, 0 skipped                                  |
| Retries used | none (one retry is allowed in CI, no test needed it)                                          |

## Results by browser

| Browser     |   Tests |  Passed | Failed | Spec time |
| ----------- | ------: | ------: | -----: | --------: |
| Chrome 156  |      50 |      50 |      0 |      30 s |
| Edge 156    |      50 |      50 |      0 |      35 s |
| Firefox 159 |      50 |      50 |      0 |      33 s |
| **Total**   | **150** | **150** |  **0** |           |

## Results by spec

| Spec                       | What it covers                                       | Tests | Status |
| -------------------------- | ---------------------------------------------------- | ----: | ------ |
| `workflows.cy.ts`          | Main user flows on the real API                      |     6 | Passed |
| `empty-states.cy.ts`       | Empty lists, no results, missing data                |     6 | Passed |
| `api-errors.cy.ts`         | 500, 503, 429, 401, 403, 404, 422, network, bad JSON |    13 | Passed |
| `loading-and-timing.cy.ts` | Skeleton, debounce, stale responses, double submit   |     5 | Passed |
| `orders-list.cy.ts`        | Paging, sorting, filters, URL state                  |     8 | Passed |
| `new-order-form.cy.ts`     | Client-side validation and request payload           |    12 | Passed |

Case IDs and expected results are in the [test plan](TEST_PLAN.md).

## Stability

No test has needed the allowed retry on any run so far. One CI problem came up that wasn't about the tests: for a few runs the runner's preinstalled Firefox never connected to Cypress, so no Firefox spec could start. CI now installs Firefox straight from Mozilla, and every run since has passed in all three browsers.

The only fixed wait (`loading-and-timing.cy.ts`, stale response test) is intentional and explained in the spec.

## Defects found

None open. One real bug came up while writing the tests and was fixed in the app: a fast double click on "Create order" could submit the form twice, because the "submitting" flag lived in React state and the second click arrived before the re-render. The guard now uses a ref, and `loading-and-timing.cy.ts` checks that only one request goes out.

## Known limitations

- Orderly is a demo app with in-memory data. There's no real database, payments or user roles; the 403 case is simulated with a stub.
- Stubbed specs prove the front end handles each response correctly. The server side is covered by the workflow specs on the real API, not by separate API tests.
- Safari isn't covered. Cypress support for WebKit is still experimental, so the matrix sticks to Chrome, Edge and Firefox.
