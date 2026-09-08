# Law Suite workspace design

The redesign uses the supplied tiled analytics dashboard as a layout reference and Diamond Echo as the color reference. It does not reproduce either site's branding, content, or page composition.

![Law Suite portfolio](design/portfolio.png)

[Research and document library](design/research.png) · [Firm Operations](design/operations.png)

## Shared palette

These values were read from the computed CSS of [Diamond Echo](https://diamondecho-review.gbengag.chatgpt.site/) on September 7, 2026. `frontend/src/theme.css` is the shared source for native controls, Tailwind components, charts, dialogs, and all application surfaces.

| Role | Color |
| --- | --- |
| Deep background | `#060c13` |
| Workspace background | `#0a141f` |
| Panel | `#0f1c2a` |
| Raised panel | `#142434` |
| Steel | `#2d628c` |
| Bright steel | `#5e9cd0` |
| Soft steel | `#a9c7e0` |
| Primary text | `#e5edf5` |
| Secondary text | `#8ba0b3` |
| Warm exception accent | `#d6a56d` |
| Dividers / strong borders | `#e5edf521` / `#e5edf547` |

## Application coverage

- One persistent navigation bar across Matter Review, Research & Documents, and Administration. The former duplicate Matter Review sidebar and oversized hero are removed.
- A compact portfolio board shows four metrics, review completion, evidence distribution, and review counts by practice. Every figure derives from current browser-local matter records. Practice chart buttons open the corresponding matter; source presence does not imply attorney review.
- Evidence inspection, conflicts, version comparisons, draft editing, source dependencies, external text intake, handoff checks, review targets, history, value estimates, dialogs, and empty states use the same dark surfaces and hierarchy.
- The disconnected Research & Documents preview includes per-matter fictional sources, local title/excerpt search, versioned source reading, and links into the selected matter's evidence, draft, and handoff tabs. Entering the library refreshes its snapshot of current local records. This is not a live research API or document ingestion pipeline.
- The optional connected prototype shares the theme, with a research heading, question starters, document controls, and activity panel. Its mobile layout stacks the panels instead of hiding collections and documents. Data and model limitations remain visible.
- Firm Operations retains its illustrative portfolio charts, filters, sample review actions, recommendations, and CSV exports with the shared colors.

## Verification

Existing attorney workflow and operations journeys remain the regression baseline. Additional browser journeys cover local excerpt search, matter isolation, navigation into the correct draft without losing edits, chart updates after review, updated source versions, and research/administration widths at 390, 768, and 1440 pixels.

The connected prototype was also inspected with mocked API responses for research, stored documents, and activity, including phone layout and a sample chat round trip. This verifies UI behavior, not a live backend deployment.

No database, authenticated identities, legal research provider, or new model integration is introduced by the redesign.
