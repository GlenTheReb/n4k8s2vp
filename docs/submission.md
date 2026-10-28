# Submission readiness

The assignment evaluates the video first. **Do not submit without the final unlisted video.** The final form must not be submitted without the user's explicit final approval.

Form: [Full Stack SWE challenge submission v4.1 intern](https://forms.cloud.microsoft/r/FTX6K2bbnU). The form was opened and read; no personal data was entered and no submission was made.

| Exact field | Prepared value / required action |
| --- | --- |
| 1. Name | User to confirm preferred full name |
| 2. Phone number | User to supply intended recruiting contact number |
| 3. LinkedIn URL | User to supply exact public profile URL |
| 4. Resume: Google Drive link, without password or access restriction | User to supply intended resume link; verify anonymous access |
| 5. Demo video link: unlisted YouTube video | Pending final narrated recording and upload; script in `video-walkthrough.md` |
| 6. App demo link: Vercel/Heroku | Pending Vercel team access resolution and public deployment |
| 7. Repo link: GitHub | Proposed `GlenTheReb/n4k8s2vp`; not created or published yet |
| 8. Email id | User to confirm recruiting email; do not infer from Git or deployment accounts |

## Remaining delivery sequence

1. Complete Vercel team consent for the existing team. The connector currently returns 403 even after the first reported approval. Retry only after the final consent screen completes, then create the isolated project and deploy these source files. Do not change another project.
2. Check the public app in a fresh unauthenticated browser context: root, source assets, API health, default Explorer, accuracy, Jan-31/Feb-1 boundary, CSV and mobile. Require zero app console errors. Record the exact production URL in this file and README.
3. Obtain explicit approval to create and publish the proposed public GitHub repository. Keep the innocuous random name. Publish source, tests, processed genuine snapshot, lockfiles, Docker setup and documentation; exclude SDD, raw responses, secrets and local environments. Verify anonymous GitHub access and clone completeness. Record the URL here and in README.
4. Rehearse and record the two-part script: customer ≤5 minutes, technical ≤5 minutes, total ≤10 minutes. The optional silent rehearsal is a visual reference, not the final submission video. Upload as **Unlisted**, copy the watch URL and verify playback while signed out.
5. Obtain the user's intended contact/profile/resume details, check every URL anonymously, and request final form approval. Only then submit.

## Current usable local URLs

- [Application, Python local server](http://127.0.0.1:8000)
- [Application, verified Docker service](http://127.0.0.1:8010)
- [Docker API docs](http://127.0.0.1:8010/docs)

These loopback addresses work on the development machine and are **not submission URLs**. Standard Compose instructions use port 8000; port 8010 was selected for testing while the Python server occupied 8000.
