[ARIES] [Campaign] Dashboard Counter Cards Display Incorrect Counts Compared to Actual Data

**Precondition**
- User is logged into the ARIES platform.
- A campaign exists with candidates in different pipeline stages.

**Steps**
1. Navigate to the Campaign Profile page.
2. Observe the summary counter cards at the top of the page:
   - Identified
   - Enriched
   - Outreach Sent
3. Review the Outreach Activity section and count the actual outreach records displayed.
4. Review the Approved Queue list and count candidates with status **Enriched**.
5. Compare the actual counts against the values displayed in the summary cards.

**Expected Result**
- Summary cards should accurately reflect the actual number of records in each corresponding stage.
- Outreach Sent count should match the total number of outreach records shown in Outreach Activity.
- Enriched count should match the total number of enriched candidates displayed in the candidate list.

**Actual Result**
- **Outreach Sent** summary card displays **34**, while only **2** outreach records are visible in the Outreach Activity section.
- **Enriched** summary card displays **34**, while the Approved Queue contains only **33** candidates with Enriched status.
- Dashboard counters appear to be out of sync with the underlying campaign data.

**Evidence**
https://www.loom.com/i/eb0a9d7b5edf4a8bb6e2b5c70a497131
https://www.loom.com/i/98121821a3724f93a94b49026a8a165e