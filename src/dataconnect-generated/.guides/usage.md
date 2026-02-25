# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.




### React
For each operation, there is a wrapper hook that can be used to call the operation.

Here are all of the hooks that get generated:
```ts
import { useUpsertMyProfile, useMarkMyProfileMigration, useCreateSaveSlot, useUpsertSaveSlot, useDeleteSaveSlot, useUpsertRunSession, useCreateRunEvent, useUpsertStoryMemory, useGetMyProfile, useListMySaveSlots } from '@dataconnect/generated/react';
// The types of these hooks are available in react/index.d.ts

const { data, isPending, isSuccess, isError, error } = useUpsertMyProfile(upsertMyProfileVars);

const { data, isPending, isSuccess, isError, error } = useMarkMyProfileMigration(markMyProfileMigrationVars);

const { data, isPending, isSuccess, isError, error } = useCreateSaveSlot(createSaveSlotVars);

const { data, isPending, isSuccess, isError, error } = useUpsertSaveSlot(upsertSaveSlotVars);

const { data, isPending, isSuccess, isError, error } = useDeleteSaveSlot(deleteSaveSlotVars);

const { data, isPending, isSuccess, isError, error } = useUpsertRunSession(upsertRunSessionVars);

const { data, isPending, isSuccess, isError, error } = useCreateRunEvent(createRunEventVars);

const { data, isPending, isSuccess, isError, error } = useUpsertStoryMemory(upsertStoryMemoryVars);

const { data, isPending, isSuccess, isError, error } = useGetMyProfile();

const { data, isPending, isSuccess, isError, error } = useListMySaveSlots();

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
import { upsertMyProfile, markMyProfileMigration, createSaveSlot, upsertSaveSlot, deleteSaveSlot, upsertRunSession, createRunEvent, upsertStoryMemory, getMyProfile, listMySaveSlots } from '@dataconnect/generated';


// Operation UpsertMyProfile:  For variables, look at type UpsertMyProfileVars in ../index.d.ts
const { data } = await UpsertMyProfile(dataConnect, upsertMyProfileVars);

// Operation MarkMyProfileMigration:  For variables, look at type MarkMyProfileMigrationVars in ../index.d.ts
const { data } = await MarkMyProfileMigration(dataConnect, markMyProfileMigrationVars);

// Operation CreateSaveSlot:  For variables, look at type CreateSaveSlotVars in ../index.d.ts
const { data } = await CreateSaveSlot(dataConnect, createSaveSlotVars);

// Operation UpsertSaveSlot:  For variables, look at type UpsertSaveSlotVars in ../index.d.ts
const { data } = await UpsertSaveSlot(dataConnect, upsertSaveSlotVars);

// Operation DeleteSaveSlot:  For variables, look at type DeleteSaveSlotVars in ../index.d.ts
const { data } = await DeleteSaveSlot(dataConnect, deleteSaveSlotVars);

// Operation UpsertRunSession:  For variables, look at type UpsertRunSessionVars in ../index.d.ts
const { data } = await UpsertRunSession(dataConnect, upsertRunSessionVars);

// Operation CreateRunEvent:  For variables, look at type CreateRunEventVars in ../index.d.ts
const { data } = await CreateRunEvent(dataConnect, createRunEventVars);

// Operation UpsertStoryMemory:  For variables, look at type UpsertStoryMemoryVars in ../index.d.ts
const { data } = await UpsertStoryMemory(dataConnect, upsertStoryMemoryVars);

// Operation GetMyProfile: 
const { data } = await GetMyProfile(dataConnect);

// Operation ListMySaveSlots: 
const { data } = await ListMySaveSlots(dataConnect);


```