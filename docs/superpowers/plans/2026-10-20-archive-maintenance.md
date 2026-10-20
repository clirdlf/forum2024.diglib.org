# Archive maintenance follow-up

Implement the user's approved recommendations without altering the captured content or published design.

- [x] Enforce generated accessibility invariants and complete transform composition in regression checks.
- [x] Clean production builds safely; isolate Pages/browser/snapshot output and pass the chosen output directory through build/verify tooling.
- [x] Refactor accessibility corrections into named steps and documented curated overrides, preserving output.
- [x] Add desktop/mobile browser smoke tests for navigation, guide tabs/disclosures, FAQ and carousel pause, running in CI.
- [x] Add verified static snapshots with checksums, tag-based GitHub release publishing, and recovery instructions.
- [x] Configure conservative grouped dependency updates and reorganize README/operations documentation.
- [x] Verify tests, root/Pages builds, browser behavior, snapshot integrity, and independent code review. No deployment or remote publication in this task.

Browser automation for this local session uses CUA. Playwright test definitions are delivered for CI; collect/list their cases locally and verify the corresponding flows via CUA. GitHub workflow execution requires the target remote repository.
