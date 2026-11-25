# SGHaus Apps Script

`Code.gs` is the data collection web app every SGHaus form writes to. It used to live only in the
Apps Script editor; this copy is the version under review. The live script is the source of truth
until Gerald redeploys from this file.

## Gerald's steps (in this order, before the app changes go live)

1. Open the live script, copy it into a scratch file and compare it with `Code.gs`. If the live one
   calls `updateLeadScore` or writes a `Lead Scores` tab, that's the lead scoring this change turns off.
2. Create a new spreadsheet for clinic sign-ups. Keep it private: don't share it by link.
3. In Project Settings > Script Properties add `SHARED_SECRET` (a long random string),
   `SHEET_ID`, `CLINIC_SHEET_ID` and `NOTIFY_EMAIL`.
4. Paste `Code.gs` into the editor and save. Run `purgeOldClinicRows` once to grant permissions.
5. Add a time-driven trigger: `purgeOldClinicRows`, day timer.
6. Deploy > Manage deployments > pencil > Version: New version > Deploy. The URL stays the same.
7. In Vercel (project `app`, Production only) add `SHEETS_SHARED_SECRET` with the same secret, then
   redeploy the site. Until both match, every form write is rejected and the forms show an error.

## Data handling

- Clinic sign-ups go to the separate sheet only, and are deleted 90 days after their clinic date.
- Every value is written as plain text; anything that could run as a formula gets a leading apostrophe.
- Deletion or access requests go to hello@sghaus.com and are handled by hand.
