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
| 6. App demo link: Vercel/Heroku | [https://n4k8s2vp.vercel.app](https://n4k8s2vp.vercel.app) — verified in fresh anonymous browser context; public browser tests pass |
| 7. Repo link: GitHub | [https://github.com/GlenTheReb/n4k8s2vp](https://github.com/GlenTheReb/n4k8s2vp) — public source and required files verified anonymously |
| 8. Email id | User to confirm recruiting email; do not infer from Git or deployment accounts |

## Remaining delivery sequence

1. Vercel team consent, isolated project creation and production deployment are complete. The public app is https://n4k8s2vp.vercel.app.
2. Public app validation is complete: root, API health, Explorer, accuracy, insights, methodology, Jan-31/Feb-1 boundary, CSV, mobile and all three browser workflows pass. Fresh anonymous navigation produced no app console warnings/errors. The exact URL is recorded here and in README.
3. Public repository creation and source publication are complete with explicit user approval. Anonymous access confirms the source, tests, processed snapshot, lockfiles, Docker setup and docs; SDD, raw responses, secrets and local environments are excluded. Keep its README and submission links synchronized with the final deployment.
4. Rehearse and record the two-part script: customer ≤5 minutes, technical ≤5 minutes, total ≤10 minutes. The optional silent rehearsal is a visual reference, not the final submission video. Upload as **Unlisted**, copy the watch URL and verify playback while signed out.
5. Obtain the user's intended contact/profile/resume details, check every URL anonymously, and request final form approval. Only then submit.

## Current usable local URLs

- [Application, Python local server](http://127.0.0.1:8000)
- [Application, verified Docker service](http://127.0.0.1:8010)
- [Docker API docs](http://127.0.0.1:8010/docs)

These loopback addresses work on the development machine and are **not submission URLs**. Standard Compose instructions use port 8000; port 8010 was selected for testing while the Python server occupied 8000.
