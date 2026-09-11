# Type of Change
- [ ]  Fix (non-breaking change which fixes an issue)
- [ ]  New feature (non-breaking change which adds functionality)
- [ ]  Refactoring (non-breaking change which improves existing functionality)
- [ ]  Breaking change (fix or feature that cause existing functionality to not work as expected)
- [ ]  Documentation

# PR Type
- [ ]  Draft (Get early feedback. Linter and tests can fail)
- [ ]  Normal (Merge the code into the main branch. Linter and tests must pass)
- [ ]  Partial (Part of feature but must have full test coverage)
- [ ]  Major (Fully functional feature ready to be used by our users)

# Change Author Checklist
- [ ]  New and existing tests pass with committed changes (`php artisan test`)
- [ ]  I've added tests which prove that feature works or fix is effective
- [ ]  I've performed a self-review of committed code according to style guidelines of this project (`vendor/bin/pint`)
- [ ]  I've verified frontend build and typescript types (`npm run types:check && npm run build`)
- [ ]  I've made corresponding changes to the documentation

# Description
Describe the changes introduced in this PR and why they were made.
