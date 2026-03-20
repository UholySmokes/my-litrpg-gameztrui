# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { getMyProfile, listMySaveSlots, getMySaveSlot, listMyRunSnapshots, getMyRunSessionByRunId, getMyRunEventByCommitId, listMyRunEventsSince, listAllMyRunSessions, listAllMyRunEvents, listMyStoryMemories } from '@dataconnect/generated';


// Operation GetMyProfile: 
const { data } = await GetMyProfile(dataConnect);

// Operation ListMySaveSlots:  For variables, look at type ListMySaveSlotsVars in ../index.d.ts
const { data } = await ListMySaveSlots(dataConnect, listMySaveSlotsVars);

// Operation GetMySaveSlot:  For variables, look at type GetMySaveSlotVars in ../index.d.ts
const { data } = await GetMySaveSlot(dataConnect, getMySaveSlotVars);

// Operation ListMyRunSnapshots:  For variables, look at type ListMyRunSnapshotsVars in ../index.d.ts
const { data } = await ListMyRunSnapshots(dataConnect, listMyRunSnapshotsVars);

// Operation GetMyRunSessionByRunId:  For variables, look at type GetMyRunSessionByRunIdVars in ../index.d.ts
const { data } = await GetMyRunSessionByRunId(dataConnect, getMyRunSessionByRunIdVars);

// Operation GetMyRunEventByCommitId:  For variables, look at type GetMyRunEventByCommitIdVars in ../index.d.ts
const { data } = await GetMyRunEventByCommitId(dataConnect, getMyRunEventByCommitIdVars);

// Operation ListMyRunEventsSince:  For variables, look at type ListMyRunEventsSinceVars in ../index.d.ts
const { data } = await ListMyRunEventsSince(dataConnect, listMyRunEventsSinceVars);

// Operation ListAllMyRunSessions: 
const { data } = await ListAllMyRunSessions(dataConnect);

// Operation ListAllMyRunEvents: 
const { data } = await ListAllMyRunEvents(dataConnect);

// Operation ListMyStoryMemories:  For variables, look at type ListMyStoryMemoriesVars in ../index.d.ts
const { data } = await ListMyStoryMemories(dataConnect, listMyStoryMemoriesVars);


```