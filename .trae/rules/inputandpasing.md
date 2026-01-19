---
alwaysApply: false
description: Apply immediately on raw input. Clean text, normalize case, and resolve synonyms against known commands before executing any game logic. Ensure user intent is interpreted correctly before processing mechanics.
---
## 1. Input&Parsing Rules (The "Interface")

In a text-based system, the parser is the player's only controller. It must be robust and forgiving.

    The "Synonym" Rule: Never rely on a single word for a command. Always implement arrays of aliases.

        Example: If the command is look, the parser must also accept examine, x, l, inspect, and view.

    Sanitize Inputs: Always strip whitespace from the beginning and end of inputs and convert text to lowercase before processing logic to prevent simple capitalization errors from blocking the player.

    Feedback for "Unknowns": Never just say "I don't understand." If the parser fails, provide context-aware hint.

        Bad: "Error."
Good: "I don't know how to do that with the [sword]."