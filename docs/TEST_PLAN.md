# Test plan

## Scope

Orderly is a small order admin app (React front end, Express API) built for this suite. The tests cover the screens an operator uses every day: signing in, the orders list, an order's details and the new order form.

The focus is on states that are easy to forget and hard to reproduce by hand: empty lists, failed requests, slow responses and expired sessions.

## Approach

- Specs in `workflows.cy.ts` talk to the real server, which is reset to the same seed data before every test.
- Everything else stubs the API with `cy.intercept()` and returns exactly what the test needs: an empty page, a 500, a 403, a dropped connection, a slow reply or an order with missing fields.
- Many tests also assert what the app sent: query parameters, request bodies and how many requests went out.
- `cy.login()` signs in through the API and caches the session with `cy.session()`. Only the tests that are about signing in use the form.
- The search debounce is tested with `cy.clock()` and `cy.tick()`. There's one fixed wait in the whole suite, explained in the spec.

## Test cases

### Workflows on the real API (`workflows.cy.ts`, tags `@smoke` `@e2e`)

| ID     | Case                                                                     |
| ------ | ------------------------------------------------------------------------ |
| E2E-01 | Sign in through the form and land on the orders list                     |
| E2E-02 | Wrong password shows an error and stays on the login page                |
| E2E-03 | Filter paid orders, open one, mark it as shipped, change survives reload |
| E2E-04 | Create an order and find it at the top of the list                       |
| E2E-05 | Search by customer name                                                  |
| E2E-06 | Signing out ends the session, protected pages redirect to sign in        |

### Empty states (`empty-states.cy.ts`)

| ID       | Stubbed response                       | Expected                                                                      |
| -------- | -------------------------------------- | ----------------------------------------------------------------------------- |
| EMPTY-01 | `GET /api/orders` with no items        | "No orders yet" with a link to create the first one                           |
| EMPTY-02 | Empty result only when `q` is present  | "No orders match your filters", Clear filters resets the search and refetches |
| EMPTY-03 | Empty result for `status=cancelled`    | No-results state, not the first-run state                                     |
| EMPTY-04 | `GET /api/notifications` with no items | No unread badge, "You're all caught up."                                      |
| EMPTY-05 | Order with an empty `items` array      | "This order has no items." and a $0.00 total                                  |
| EMPTY-06 | Order without customer, date and total | Placeholders instead of "undefined" or "NaN"                                  |

### API errors (`api-errors.cy.ts`, tag `@api-errors`)

| ID     | Endpoint                 | Stubbed response        | Expected                                                       |
| ------ | ------------------------ | ----------------------- | -------------------------------------------------------------- |
| ERR-01 | `GET /api/orders`        | 500 once, then real API | Error state, "Try again" loads the list, 2 requests total      |
| ERR-02 | `GET /api/orders`        | 503                     | Maintenance message                                            |
| ERR-03 | `GET /api/orders`        | `forceNetworkError`     | Connection message                                             |
| ERR-04 | `GET /api/orders`        | 429                     | Rate limit message                                             |
| ERR-05 | `GET /api/orders`        | 200 with an HTML body   | "Couldn't read" message, no crash                              |
| ERR-06 | `GET /api/notifications` | 500                     | Orders still load, only the notifications panel shows an error |
| ERR-07 | `GET /api/orders`        | 401 once                | Redirect to sign in, then back to the same URL with filters    |
| ERR-08 | `GET /api/orders/:id`    | none (real 404)         | "Order not found"                                              |
| ERR-09 | `GET /api/orders/:id`    | 403                     | No-access message, no status controls                          |
| ERR-10 | `GET /api/orders/:id`    | 500 once, then fixture  | Retry loads the order                                          |
| ERR-11 | `PATCH /api/orders/:id`  | 500                     | Error toast, status select goes back to the old value          |
| ERR-12 | `POST /api/orders`       | 422 with field errors   | Server message under the right field, field focused            |
| ERR-13 | `POST /api/orders`       | 500                     | Form error, typed values kept, button enabled                  |

### Loading and timing (`loading-and-timing.cy.ts`)

| ID      | Case                                                               |
| ------- | ------------------------------------------------------------------ |
| LOAD-01 | Skeleton shows during a slow response and disappears after         |
| LOAD-02 | Search waits 400 ms after the last keystroke and sends one request |
| LOAD-03 | A slow older response doesn't overwrite a newer one                |
| LOAD-04 | Status button is disabled and shows "Saving..." during the request |
| LOAD-05 | Double-clicking "Create order" sends exactly one request           |

### Orders list (`orders-list.cy.ts`, served from a 45-order fixture)

| ID      | Case                                                      |
| ------- | --------------------------------------------------------- |
| LIST-01 | First page: 10 rows, formatted date, money and status     |
| LIST-02 | Next page sends `page=2` and updates the URL              |
| LIST-03 | Last page shows the remaining 5 orders, Next is disabled  |
| LIST-04 | Sorting sends `sort=total_desc` and resets to page 1      |
| LIST-05 | Status filter sends `status=pending` and resets to page 1 |
| LIST-06 | Filter, sort and page are restored from the URL           |
| LIST-07 | Clicking an order opens its details                       |
| LIST-08 | Unread notifications count and list in the header         |

### New order form (`new-order-form.cy.ts`)

| ID      | Case                                                       |
| ------- | ---------------------------------------------------------- |
| FORM-01 | Empty form flags every required field and sends no request |
| FORM-02 | 9 invalid values rejected one at a time (data-driven)      |
| FORM-03 | Error clears as soon as the value is fixed                 |
| FORM-04 | Valid form sends the exact payload and opens the new order |

## Test data

- The server seeds 45 orders with a fixed random seed, so ids, names and totals are the same on every run.
- `cypress/fixtures/orders/` holds a copy of that data for stubbed tests.
- `cypress/support/factories.ts` builds one-off orders and pages for edge cases.

## Exit criteria

- All specs pass in Chrome, Firefox and Edge on GitHub Actions.
- Lint and type checks pass.
