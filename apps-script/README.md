# SGHaus Apps Script

`Code.gs` is the data collection web app every SGHaus form writes to. It used to live only in the
Apps Script editor; this copy is the version under review. The live script is the source of truth
until Gerald redeploys from this file.

## Gerald's steps (order matters)

The live site must send the secret before the script starts demanding it, or every form on
sghaus.com fails. The current live script ignores the extra `secret` field, so the app goes first.

1. In Vercel (project `app`, Production only) add `SHEETS_SHARED_SECRET`: a long random string.
2. Merge and deploy the phase 1 app changes. Forms keep working against the current script.
3. Open the live script and compare it with `Code.gs`. If the live one calls `updateLeadScore` or
   writes a `Lead Scores` tab, that's the lead scoring this change turns off.
4. Create a new spreadsheet for clinic sign-ups. Keep it private: don't share it by link.
5. In Project Settings > Script Properties add `SHARED_SECRET` (the same string as step 1),
   `SHEET_ID`, `CLINIC_SHEET_ID` and `NOTIFY_EMAIL`.
6. Paste `Code.gs` into the editor and save. Run `purgeOldClinicRows` once to grant permissions,
   then add a time-driven trigger for it (day timer).
7. Deploy > Manage deployments > pencil > Version: New version > Deploy. The URL stays the same.
8. Submit the contact form once on sghaus.com and check the row lands in the Contact tab.

## Data handling

- Clinic sign-ups go to the separate sheet only, and are deleted 90 days after their clinic date.
- Every value is written as plain text; anything that could run as a formula gets a leading apostrophe.
- Deletion or access requests go to hello@sghaus.com and are handled by hand.
