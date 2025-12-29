# Client Requirement Analysis
**Date**: 2025-12-28
**Source**: Client Chat Record

## 1. Problem Statement
The client feels that the current "Time Polling" mechanism makes it hard to track data because:
- The results "flash" (update too quickly or transiently).
- There is no persistent record of what was just queried.
- They find "Time Polling" potentially troublesome or less precise than "Block Polling".

## 2. Proposed Solution: "Block Stepping & History Log"

The client specifically requested two core features:

### A. Block Stepping (Block Interval Query)
Instead of just refreshing the *same* range every X seconds, they want to **move** the range forward step-by-step.

- **Concept**: "Walk" through the blockchain blocks.
- **Workflow**:
  1.  Current is Block 10. User sets "Step Size" to 2.
  2.  User clicks "Next" (or "Query").
  3.  System queries range **10-12**.
  4.  User clicks "Next" again.
  5.  System updates range to **12-14** and queries again.
  6.  (And so on...)

### B. History Log (Session Recording)
Every time a query returns data (e.g., for range 10-12), the summary stats must be **saved** to a list so they don't disappear when the next query runs.

- **Data to Record**:
  - Block Range (Start - End)
  - Total Buy Amount
  - Total Sell Amount
  - Transaction Count
- **Controls**:
  - **Auto-Record**: This should happen automatically on every click/query.
  - **Delete**: Button to clear specific history items or the whole log.

## 3. Implementation Proposal
We need to modify the `TokenFilterAnalysis.vue` component.

1.  **Add "Stepping" Controls**:
    - Input: `Step Size` (default e.g., 100 blocks).
    - Button: `Next Step >` (Increments `startBlock` and `endBlock` by `stepSize` then calls `fetchAllData`).
    - Button: `< Prev Step` (Decrements, optional but good for UX).

2.  **Add "History Log" Section**:
    - A new `<a-table>` or list below the main search area.
    - Stores an array `historyRecords`.
    - `push` new result to this array after `fetchAllData` succeeds.
    - Add "Clear History" button.

3.  **Refine "Polling"**:
    - The client mentioned "if time polling is troublesome...". We should probably **keep** the existing polling but maybe add an option: "Auto-Step polling"? (i.e., every 5 seconds, move to next block range).
    - *Interpretation*: The client's example ("click once 10-12, click again 12-14") sounds **Manual**, but they also said "Auto record". Let's implement **Manual Stepping** first as it gives more control, which seems to be what they want ("Look at 10-12, then look at 12-14").

## 4. UI Layout Changes
```
[ Search Form ]
[ Block Stepping Controls: < Prev | Step Size: 100 | Next > ]

[ History Log (New) ]
| Range     | Buy Total | Sell Total | Net Flow | Actions |
| 100-200   | 500       | 20         | +480     | [Del]   |
| 200-300   | ...       | ...        | ...      | [Del]   |

[ Detailed Results (Existing Table) ]
```
