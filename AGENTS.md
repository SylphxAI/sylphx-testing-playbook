# Agent Instructions

Engineering doctrine: [SylphxAI/doctrine](https://github.com/SylphxAI/doctrine)

Before changing this repository, read `PROJECT.md`, `.doctrine/project.json`,
and the triggered standards in `SylphxAI/doctrine`.

This file is a thin runtime adapter. Keep enterprise policy in doctrine; keep
only repo-local commands, hazards, and validation notes here.

## Local Commands

- `python3 /Users/kyle/.doctrine/scripts/project-control-plane-audit.py --local . --fail-on-drift --json`
- CI runs Markdown lint and internal link checks through `.github/workflows/ci.yml`.

## Local Hazards

- This is a documentation and template repository. Do not add project-specific
  test policy for a single product unless it is framed as a reusable method,
  template, or case study.
- External tool claims must remain evidence-backed and dated when they can
  drift.

## Reporting

Separate local docs diff, PR state, CI state, merge state, and any downstream
adoption proof in consuming repositories.
