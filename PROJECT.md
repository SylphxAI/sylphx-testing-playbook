# Sylphx Testing Playbook Project

Sylphx Testing Playbook is a documentation and template repository cataloging
modern software testing methods, selection guidance, reusable configs, and a
case study for production-grade quality programs.

## Lifecycle

- Lifecycle: `active`
- Layer: `research`
- Doctrine source of truth: [SylphxAI/doctrine](https://github.com/SylphxAI/doctrine)
- Machine manifest: `.doctrine/project.json`

## Goals

- Maintain the testing-method taxonomy, maturity matrix, selection guide,
  templates, language notes, and case study.
- Keep method guidance reusable across repositories rather than tailored to one
  product's local workflow.
- Keep evidence-sensitive claims reviewable and dated when the ecosystem can
  drift.

## Non-Goals

- Do not own individual product repositories' CI pipelines or test suites.
- Do not become an enterprise doctrine replacement; durable policy belongs in
  `SylphxAI/doctrine`.
- Do not present speculative tools or benchmarks as current fact without
  supporting evidence.

## Boundaries

This repository owns reusable testing education, method descriptions, decision
guides, templates, language notes, and case studies. Product repositories own
their own concrete test implementation, CI gates, fixtures, and production
quality proof.

## Public Surfaces

- Testing playbook documentation in `README.md`, `methods/`, `matrix/`, and
  `languages/`
- Copyable templates in `templates/`
- Case study in `case-studies/`
- CI workflow in `.github/workflows/ci.yml`

## Delivery

PRs run Markdown lint and internal link checks. There is no hosted deploy path;
production proof is a passing docs CI run and successful default-branch
readback after merge.

## Commercial Direction

`not-applicable`: this repository is a reusable documentation and template
catalog. Commercial packaging or pricing decisions belong in consuming products
or a future explicit commercial ADR.
