# Feature Logic: Real-Time Active Monitor
**Status**: Planned
**Related Component**: `TokenFilterAnalysis.vue`

## 1. Requirement Analysis
### User Feedback
> "The history log only shows past tense. I want the current time period (e.g., 12:15-12:30) to appear immediately at the top and update its numbers in real-time as transactions come in."

### Core Problem
The current "History Log" is purely retrospective. A row is only added *after* a query completes. The user wants a **Live Monitor** experience where the *current* incomplete period is visible and active.

## 2. Proposed Solution: The "Pending Row" Model

We will introduce a special **"Active Pending Row"** at the top of the history list.

### 2.1 Visual State
*   **Location**: Always the first row in the History Table.
*   **Style**: Highlighted (e.g., pulsating green dot or "Active" badge) to differentiate it from finalized history.
*   **Content**:
    *   **Time**: Current Start Time (e.g., "12:15 (Live)").
    *   **Range**: The target range for this period (e.g., `StartBlock` to `StartBlock + StepSize`).
    *   **Counts/Amounts**: Updates dynamically every polling interval (e.g., 5s).

### 2.2 Logic Flow

#### A. Initialization (Start of Period)
1.  User clicks "Start Polling" (or Auto-Step triggers).
2.  System immediately **creates a new Row Object** in `historyRecords` at index 0.
3.  Initial state: `Count: 0`, `Amount: 0`, `Status: Pending`.

#### B. Polling (During Period)
1.  Every 5 seconds, the system fetches the *current* data for the active range.
2.  **Crucial Difference**: Instead of *adding new rows*, it **UPDATES** the existing Index 0 row.
3.  The UI reflects the new numbers immediately (e.g., Buy Count jumps from 5 -> 12).

#### C. Finalization (End of Period)
1.  Condition met: Time reaches limit (e.g., 15 mins) OR Data volume reaches limit (e.g., 1200 blocks).
2.  The system marks Index 0 as `Status: Final`.
3.  The system calculates the **Next Range**:
    *   `New Start = Old End`
    *   `New End = New Start + StepSize`
4.  The system **Unshifts a NEW Pending Row** to the top.
5.  The cycle repeats.

## 3. Technical Changes Required

### Frontend (`TokenFilterAnalysis.vue`)
1.  **State Management**:
    *   Add `activeRowId`: Track which history record is currently "live".
2.  **API Logic**:
    *   Modify `addToHistory()`:
        *   If `activeRowId` exists, **find and update** that record.
        *   If no active row (or period ended), **create new** record and set as active.
3.  **Polling Loop**:
    *   Ensure the polling function differentiates between "Update Current View" and "Step Forward".

### Backend
*   No changes required (unless we need a specific "delta" API, but current full-range aggregate is sufficient for small windows).

## 4. Mockup
```text
| Time           | Range             | Buy (Count/Amt) | Status     |
|----------------|-------------------|-----------------|------------|
| 12:15 (Live)   | 73882036-73883236 | 15 / 500.23     | 🟢 Active  |  <-- Updates every 5s
| 12:00          | 73879636-73880836 | 120 / 4500.00   | ⚫️ History |
| 11:45          | 73878436-73879636 | 98 / 3200.50    | ⚫️ History |
```
