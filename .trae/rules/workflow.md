---
alwaysApply: false
description: Apply during active coding and testing phases. Isolate new mechanics in a single-room test chamber (MVP) for verification first, and enable detailed input logging to analyze parser errors and player behavior.
---
 ## 5. Development Workflow

The "MVP" Room: Before building the whole world, build one room containing:

One item to pick up.

One container to open.

One exit to a dummy room.

Why? If you can get the interactions right in this "test chamber," you can scale the system indefinitely.

Logger Implementation: Implement a simple log that records player inputs. This is crucial for debugging to see what words players are trying to use that you didn't anticipate.
