# Domain modules

Each bounded context owns its domain types, application commands/use cases,
infrastructure repositories, and presentation controllers. The legacy
`finance` facade currently preserves the public API while these contexts are
migrated incrementally.
