# Interface design and QA reference

Direction: calm dark energy analytics with a fixed navigation rail, editable decision filters, four unboxed metrics, a primary chart plus interval inspector, and a publication audit table. Native HTML controls and Recharts keep the product practical and accessible. No decorative inactive controls.

Design tokens: background `#0b1120`; navigation `#0d1626`; panels `#111c2d`; border `#25354c`; text `#eef3fb`; muted `#98a9c2`; forecast `#55dfb4`; observed `#8b9dff`; caution `#f2bd7b`. Manrope headings, DM Sans body, system fallbacks. Shared 6–8px radii; 16–24px panel spacing. Icons use one Lucide outline family. Respect reduced-motion preferences.

The ImageGen concept was inspected at its native 1536×1024 size. Its local preview path is intentionally not a repository asset; the final UI is code-native. A live browser screenshot was inspected at the same viewport. Comparison covered: navigation rail, page/filter hierarchy, unboxed metric strip, palette, chart/inspector split, audit table, typography, and narrow-screen reflow.

Intentional differences from the illustrative concept: real source targets are hourly (the concept illustrated three-hour targets); real numbers replace dashes; the timezone and next-day delivery are explanatory text rather than misleading editable controls; Apply cutoff makes the applied-versus-draft state clear; explicit assumptions, sample counts and coverage take space; the audit table paginates actual records. All visible numerical claims come from API records. Final screenshot and mobile evidence are kept outside the source tree.
