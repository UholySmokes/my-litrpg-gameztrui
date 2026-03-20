# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useGetMyProfile, useListMySaveSlots, useGetMySaveSlot, useListMyRunSnapshots, useGetMyRunSessionByRunId, useGetMyRunEventByCommitId, useListMyRunEventsSince, useListAllMyRunSessions, useListAllMyRunEvents, useListMyStoryMemories } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useGetMyProfile();

const { data, isPending, isSuccess, isError, error } = useListMySaveSlots();

const { data, isPending, isSuccess, isError, error } = useGetMySaveSlot(getMySaveSlotVars);

const { data, isPending, isSuccess, isError, error } = useListMyRunSnapshots(listMyRunSnapshotsVars);

const { data, isPending, isSuccess, isError, error } = useGetMyRunSessionByRunId(getMyRunSessionByRunIdVars);

const { data, isPending, isSuccess, isError, error } = useGetMyRunEventByCommitId(getMyRunEventByCommitIdVars);

const { data, isPending, isSuccess, isError, error } = useListMyRunEventsSince(listMyRunEventsSinceVars);

const { data, isPending, isSuccess, isError, error } = useListAllMyRunSessions();

const { data, isPending, isSuccess, isError, error } = useListAllMyRunEvents();

const { data, isPending, isSuccess, isError, error } = useListMyStoryMemories(listMyStoryMemoriesVars);

```

Here's an example from a different generated SDK:

```ts
import { useListAllMovies } from '@dataconnect/generated/react';

function MyComponent() {
  const { isLoading, data, error } = useListAllMovies();
  if(isLoading) {
    return <div>Loading...</div>
  }
  if(error) {
    return <div> An Error Occurred: {error} </div>
  }
}

// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MyComponent from './my-component';

function App() {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>
    <MyComponent />
  </QueryClientProvider>
}
```



## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { getMyProfile, listMySaveSlots, getMySaveSlot, listMyRunSnapshots, getMyRunSessionByRunId, getMyRunEventByCommitId, listMyRunEventsSince, listAllMyRunSessions, listAllMyRunEvents, listMyStoryMemories } from '@dataconnect/generated';


// Operation GetMyProfile: 
const { data } = await GetMyProfile(dataConnect);

// Operation ListMySaveSlots: 
const { data } = await ListMySaveSlots(dataConnect);

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