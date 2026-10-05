Go to outside of this project and read anorcar/docs/ai first!

# ANORCAR frontend Modification Instructions

This client project being migrated from nestar-next to anorcar-next

## Rules

- Preserve current project architecture
  -Keep GraphQL/Apollo Integration
- Do not rewrite the whole app
  -Improve UI incrementally

## Backend Context

Before making any changes, read:

-`docs/ai/BACKEND_MIGRATION.md`
\-`docs/ai/COMPLETED_TASKS.md`
\-`docs/ai/DECISIONS.md`
\-`docs/ai/NEXT_STEPS.md`
and etc inside of anorcar/docs/ai

## Workflow

1. Analyze before editing.
2. Backend is running on port http://localhost:3007/graphql now.
3. Make small incremental changes.
4. Run typecheck after each phase.
5. Do not remove working logic unless replaced safely.
6. Update anorcar/docs/ai/COMPLETED_TASKS.md after major changes.
