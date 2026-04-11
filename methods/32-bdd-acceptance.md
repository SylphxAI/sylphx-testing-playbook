# 32 — BDD / Gherkin Acceptance Testing

> Given/When/Then specs driving test frameworks (Cucumber). Primarily a stakeholder communication tool.

**Category:** Situational
**Effort:** Medium
**ROI:** Low (prefer plain tests)
**Maturity level:** — (not a quality metric)

## Our opinion: skip it

BDD's value is NOT test quality. It's STAKEHOLDER COMMUNICATION — letting product managers write specs that translate to executable tests.

In 2027, most teams have abandoned Gherkin DSL in favor of:
1. **Plain TypeScript tests** with descriptive `describe` names
2. **Direct collaboration** between engineers and PMs on tests
3. **Storybook stories** for UI behaviour docs

## When it still makes sense

- **Regulated industries** where specs are legally binding
- **Very large teams** with strict product/engineering separation
- **Legacy projects** already invested in Cucumber

## Tools (if you must)

- **Cucumber.js**
- **Playwright + @cucumber/cucumber**
- **SpecFlow** (.NET)

## Example

```gherkin
# features/signup.feature
Feature: User signup
  Scenario: New user creates account
    Given I am on the signup page
    When I enter "test@example.com" and "password123"
    And I click "Create account"
    Then I should be redirected to the dashboard
```

```typescript
// steps/signup.steps.ts
Given('I am on the signup page', async ({ page }) => {
  await page.goto('/signup')
})
// ... etc
```

Compare to the plain version:

```typescript
test('new user creates account', async ({ page }) => {
  await page.goto('/signup')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password123')
  await page.click('text=Create account')
  await expect(page).toHaveURL('/dashboard')
})
```

The plain version is shorter, cleaner, and catches the same bugs. **Prefer it.**

## Further reading

- [Cucumber.js](https://github.com/cucumber/cucumber-js)
- [Kent C. Dodds — "Avoid BDD"](https://kentcdodds.com/blog/avoid-nesting-when-youre-testing)
