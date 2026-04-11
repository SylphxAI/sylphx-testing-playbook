# Contributing

Thanks for considering a contribution! This playbook works because it's
**opinionated** — every claim is backed by a real commit, a tool with
active maintenance, or a case study.

## How to add a new method

1. **Check it's not already covered.** Search the `methods/` directory
   and the [README table](README.md#the-35-methods) first.
2. **Copy the template.** Start from [`methods/TEMPLATE.md`](methods/TEMPLATE.md).
3. **Number it.** Use the next available number (36+).
4. **Write the doc.** Follow the template sections — every section
   matters. Don't skip "When NOT to use" (we need counter-cases).
5. **Add a template.** If the method needs a config or example file,
   add it to `templates/<tool-name>/`.
6. **Link it** from the README's main table.
7. **Submit a PR.** Include:
   - Why this method is in-scope for the playbook
   - Link to a tool with > 1000 GitHub stars (or a commit showing real adoption)
   - A 1-sentence diff vs existing methods (what does it catch that the
     others don't?)

## Quality bar

- **Every claim needs evidence.** Either link a commit showing real use,
  or cite a paper / industry practice with a name attached.
- **Opinionated over neutral.** This isn't Wikipedia. If method X is
  better than method Y for most cases, say so.
- **Code examples must be working.** No pseudocode — show real TypeScript
  that would compile (except where another language is the whole point).
- **No "it depends" hedging.** If the answer is "it depends", explain
  WHAT it depends on.

## Style

- **Second person** ("you", not "one")
- **Active voice** ("the framework generates", not "mutants are generated")
- **Concrete verbs** ("catches", "prevents", "proves") over abstract
  ("addresses", "handles", "facilitates")
- **No marketing speak** ("comprehensive", "robust", "best-in-class")

## What we WON'T accept

- **Methods behind paywalls** — readers must be able to try it without
  signing a contract
- **Abandoned tools** — if the last commit was > 18 months ago, no
- **Duplicate methods** — if it's 90% overlap with an existing entry,
  extend the existing doc instead
- **"Just use X" with no nuance** — every method has a tradeoff; list it

## File structure checklist

Before submitting:

- [ ] `methods/NN-name.md` created
- [ ] README updated with link in the right category
- [ ] Template added to `templates/` if applicable
- [ ] Case study reference added (if you've used it)
- [ ] Maturity matrix updated (if this changes level thresholds)
- [ ] Selection guide updated (if this changes recommendations)
- [ ] All internal links work

## CI checks

On PR, the CI runs:
- Markdown lint (`markdownlint`)
- Link checker (all internal `[text](link)` must resolve)
- Spell check (cspell with our custom dictionary)

Red CI → PR blocked. Fix locally first.

## Review process

1. Maintainer reviews the claim + evidence
2. We may ask for real code examples from your own projects
3. Once merged, the method appears in the next release notes
4. If your method becomes mainstream, we'll bump its priority in the
   selection guide

## Disclaimers

- The playbook is MIT licensed. Forks are encouraged.
- Contributions are under the same license.
- By contributing, you confirm you have the right to share the content.
- We may edit contributions for consistency with the rest of the playbook.
