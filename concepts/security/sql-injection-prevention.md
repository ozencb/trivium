---
model: claude-sonnet-4-6
prompt_version: c367b0e2e48d
---

## SQL Injection Prevention

SQL injection happens when user-supplied input gets concatenated directly into a SQL string and the database interprets part of that input as SQL syntax. The fix is parameterized queries: the query structure is sent to the database separately from the data, so the database can never confuse the two.

**The core mechanism**

When you use a parameterized query, the database receives the SQL template first — with placeholders instead of values — and compiles it into an execution plan. The user's data arrives in a second step, after the structure is locked. At that point the database treats every byte of user input as a literal value. It has no parsing step left to perform on it.

This is structurally different from escaping. Escaping tries to make dangerous characters safe by transforming them. Parameterization eliminates the attack surface entirely by separating the channel that carries code from the channel that carries data. You can't inject SQL through a data channel, the same way you can't execute arbitrary commands through a JSON field in an HTTP response just by putting semicolons in it.

**Concrete example**

Vulnerable:
```sql
"SELECT * FROM users WHERE email = '" + userInput + "'"
```

If `userInput` is `' OR '1'='1`, the resulting query returns every row in the table.

Parameterized (Python/psycopg2):
```python
cursor.execute("SELECT * FROM users WHERE email = %s", (user_input,))
```

The `%s` placeholder is not string interpolation — the driver sends the query and the value in separate protocol frames. The input `' OR '1'='1` is stored as a literal string to match against, not parsed.

**Where this shows up in practice**

*Backend:* Every time you build a query from external input — user-submitted forms, API parameters, path variables, even internal values that trace back to user data. ORMs handle this by default for standard queries, but raw `execute()` calls or string-formatting shortcuts in complex queries are where it creeps back in.

*Fullstack:* BFF layers that accept filter/sort parameters and pass them into queries are a classic source of vulnerabilities. The risk multiplies when query builders accept arbitrary field names or operators from the client.

**Common pitfalls**

- Thinking ORM usage means you're safe — raw queries, `.query()` escapes, and dynamic `ORDER BY` clauses often bypass parameterization.
- Parameterizing values but not identifiers (table/column names). Identifiers can't be parameterized in most databases; use an allowlist instead.
- Trusting that data is "internal" because it came from your own DB — if it originated from user input at write time, it should still be parameterized at read time.

The invariant to hold: *query structure is static, user input is always data.* If something breaks that invariant, it's a potential injection vector.
