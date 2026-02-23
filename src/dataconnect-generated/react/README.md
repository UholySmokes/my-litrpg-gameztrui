# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`dataconnect-generated/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@dataconnect/generated/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyProfile*](#getmyprofile)
  - [*ListMySaveSlots*](#listmysaveslots)
  - [*GetMySaveSlot*](#getmysaveslot)
  - [*ListMyRunSnapshots*](#listmyrunsnapshots)
  - [*GetMyRunSessionByRunId*](#getmyrunsessionbyrunid)
  - [*GetMyRunEventByCommitId*](#getmyruneventbycommitid)
  - [*ListMyRunEventsSince*](#listmyruneventssince)
  - [*ListMyStoryMemories*](#listmystorymemories)
- [**Mutations**](#mutations)
  - [*UpsertMyProfile*](#upsertmyprofile)
  - [*MarkMyProfileMigration*](#markmyprofilemigration)
  - [*CreateSaveSlot*](#createsaveslot)
  - [*UpsertSaveSlot*](#upsertsaveslot)
  - [*DeleteSaveSlot*](#deletesaveslot)
  - [*UpsertRunSession*](#upsertrunsession)
  - [*CreateRunEvent*](#createrunevent)
  - [*UpsertStoryMemory*](#upsertstorymemory)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `example`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `example` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## GetMyProfile
You can execute the `GetMyProfile` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMyProfile(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyProfileData>): UseDataConnectQueryResult<GetMyProfileData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMyProfile(options?: useDataConnectQueryOptions<GetMyProfileData>): UseDataConnectQueryResult<GetMyProfileData, undefined>;
```

### Variables
The `GetMyProfile` Query has no variables.
### Return Type
Recall that calling the `GetMyProfile` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMyProfile` Query is of type `GetMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetMyProfileData {
  userProfile?: {
    id: string;
    displayName?: string | null;
    migrationVersion?: number | null;
    createdAt: DateString;
    updatedAt: DateString;
  } & UserProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMyProfile`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useGetMyProfile } from '@dataconnect/generated/react'

export default function GetMyProfileComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMyProfile();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMyProfile(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyProfile(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyProfile(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMySaveSlots
You can execute the `ListMySaveSlots` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMySaveSlots(dc: DataConnect, options?: useDataConnectQueryOptions<ListMySaveSlotsData>): UseDataConnectQueryResult<ListMySaveSlotsData, undefined>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMySaveSlots(options?: useDataConnectQueryOptions<ListMySaveSlotsData>): UseDataConnectQueryResult<ListMySaveSlotsData, undefined>;
```

### Variables
The `ListMySaveSlots` Query has no variables.
### Return Type
Recall that calling the `ListMySaveSlots` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMySaveSlots` Query is of type `ListMySaveSlotsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListMySaveSlotsData {
  userProfile?: {
    id: string;
    displayName?: string | null;
    saveSlots: ({
      id: UUIDString;
      saveName: string;
      playerName: string;
      playerLevel: number;
      worldId: string;
      locationId: string;
      mapId?: string | null;
      playerPosJson?: string | null;
      entityStatesJson?: string | null;
      questFlagsJson?: string | null;
      turnCount: number;
      contentVersion?: string | null;
      stateVersion?: number | null;
      runId?: string | null;
      seq?: number | null;
      tick?: number | null;
      stateHash?: string | null;
      createdAt: DateString;
      updatedAt: DateString;
    } & SaveSlot_Key)[];
  } & UserProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMySaveSlots`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';
import { useListMySaveSlots } from '@dataconnect/generated/react'

export default function ListMySaveSlotsComponent() {
  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMySaveSlots();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMySaveSlots(dataConnect);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMySaveSlots(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMySaveSlots(dataConnect, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetMySaveSlot
You can execute the `GetMySaveSlot` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMySaveSlot(dc: DataConnect, vars: GetMySaveSlotVariables, options?: useDataConnectQueryOptions<GetMySaveSlotData>): UseDataConnectQueryResult<GetMySaveSlotData, GetMySaveSlotVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMySaveSlot(vars: GetMySaveSlotVariables, options?: useDataConnectQueryOptions<GetMySaveSlotData>): UseDataConnectQueryResult<GetMySaveSlotData, GetMySaveSlotVariables>;
```

### Variables
The `GetMySaveSlot` Query requires an argument of type `GetMySaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetMySaveSlotVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `GetMySaveSlot` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMySaveSlot` Query is of type `GetMySaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetMySaveSlotData {
  saveSlot?: {
    id: UUIDString;
    saveName: string;
    gameStateJson: string;
    playerName: string;
    playerLevel: number;
    worldId: string;
    locationId: string;
    mapId?: string | null;
    playerPosJson?: string | null;
    entityStatesJson?: string | null;
    questFlagsJson?: string | null;
    turnCount: number;
    contentVersion?: string | null;
    stateVersion?: number | null;
    runId?: string | null;
    seq?: number | null;
    tick?: number | null;
    stateHash?: string | null;
    createdAt: DateString;
    updatedAt: DateString;
  } & SaveSlot_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMySaveSlot`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetMySaveSlotVariables } from '@dataconnect/generated';
import { useGetMySaveSlot } from '@dataconnect/generated/react'

export default function GetMySaveSlotComponent() {
  // The `useGetMySaveSlot` Query hook requires an argument of type `GetMySaveSlotVariables`:
  const getMySaveSlotVars: GetMySaveSlotVariables = {
    id: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMySaveSlot(getMySaveSlotVars);
  // Variables can be defined inline as well.
  const query = useGetMySaveSlot({ id: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMySaveSlot(dataConnect, getMySaveSlotVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMySaveSlot(getMySaveSlotVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMySaveSlot(dataConnect, getMySaveSlotVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.saveSlot);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMyRunSnapshots
You can execute the `ListMyRunSnapshots` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMyRunSnapshots(dc: DataConnect, vars: ListMyRunSnapshotsVariables, options?: useDataConnectQueryOptions<ListMyRunSnapshotsData>): UseDataConnectQueryResult<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMyRunSnapshots(vars: ListMyRunSnapshotsVariables, options?: useDataConnectQueryOptions<ListMyRunSnapshotsData>): UseDataConnectQueryResult<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
```

### Variables
The `ListMyRunSnapshots` Query requires an argument of type `ListMyRunSnapshotsVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListMyRunSnapshotsVariables {
  runId: string;
}
```
### Return Type
Recall that calling the `ListMyRunSnapshots` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMyRunSnapshots` Query is of type `ListMyRunSnapshotsData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListMyRunSnapshotsData {
  userProfile?: {
    id: string;
    snapshots: ({
      id: UUIDString;
      saveName: string;
      playerName: string;
      playerLevel: number;
      worldId: string;
      locationId: string;
      turnCount: number;
      seq?: number | null;
      tick?: number | null;
      stateHash?: string | null;
      updatedAt: DateString;
    } & SaveSlot_Key)[];
  } & UserProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMyRunSnapshots`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListMyRunSnapshotsVariables } from '@dataconnect/generated';
import { useListMyRunSnapshots } from '@dataconnect/generated/react'

export default function ListMyRunSnapshotsComponent() {
  // The `useListMyRunSnapshots` Query hook requires an argument of type `ListMyRunSnapshotsVariables`:
  const listMyRunSnapshotsVars: ListMyRunSnapshotsVariables = {
    runId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMyRunSnapshots(listMyRunSnapshotsVars);
  // Variables can be defined inline as well.
  const query = useListMyRunSnapshots({ runId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMyRunSnapshots(dataConnect, listMyRunSnapshotsVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMyRunSnapshots(listMyRunSnapshotsVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMyRunSnapshots(dataConnect, listMyRunSnapshotsVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetMyRunSessionByRunId
You can execute the `GetMyRunSessionByRunId` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMyRunSessionByRunId(dc: DataConnect, vars: GetMyRunSessionByRunIdVariables, options?: useDataConnectQueryOptions<GetMyRunSessionByRunIdData>): UseDataConnectQueryResult<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMyRunSessionByRunId(vars: GetMyRunSessionByRunIdVariables, options?: useDataConnectQueryOptions<GetMyRunSessionByRunIdData>): UseDataConnectQueryResult<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
```

### Variables
The `GetMyRunSessionByRunId` Query requires an argument of type `GetMyRunSessionByRunIdVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetMyRunSessionByRunIdVariables {
  runId: string;
}
```
### Return Type
Recall that calling the `GetMyRunSessionByRunId` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMyRunSessionByRunId` Query is of type `GetMyRunSessionByRunIdData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetMyRunSessionByRunIdData {
  userProfile?: {
    id: string;
    runSessions: ({
      id: UUIDString;
      runId: string;
      worldId: string;
      mapId: string;
      playerPosJson: string;
      entityStatesJson: string;
      questFlagsJson: string;
      seq: number;
      tick: number;
      stateHash: string;
      contentVersion: string;
      stateVersion: number;
      saveSlotId?: UUIDString | null;
      runSeed?: string | null;
      lastCommitId?: string | null;
      lastClientId?: string | null;
      createdAt: DateString;
      updatedAt: DateString;
    } & RunSession_Key)[];
  } & UserProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMyRunSessionByRunId`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetMyRunSessionByRunIdVariables } from '@dataconnect/generated';
import { useGetMyRunSessionByRunId } from '@dataconnect/generated/react'

export default function GetMyRunSessionByRunIdComponent() {
  // The `useGetMyRunSessionByRunId` Query hook requires an argument of type `GetMyRunSessionByRunIdVariables`:
  const getMyRunSessionByRunIdVars: GetMyRunSessionByRunIdVariables = {
    runId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMyRunSessionByRunId(getMyRunSessionByRunIdVars);
  // Variables can be defined inline as well.
  const query = useGetMyRunSessionByRunId({ runId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMyRunSessionByRunId(dataConnect, getMyRunSessionByRunIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyRunSessionByRunId(getMyRunSessionByRunIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyRunSessionByRunId(dataConnect, getMyRunSessionByRunIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## GetMyRunEventByCommitId
You can execute the `GetMyRunEventByCommitId` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useGetMyRunEventByCommitId(dc: DataConnect, vars: GetMyRunEventByCommitIdVariables, options?: useDataConnectQueryOptions<GetMyRunEventByCommitIdData>): UseDataConnectQueryResult<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useGetMyRunEventByCommitId(vars: GetMyRunEventByCommitIdVariables, options?: useDataConnectQueryOptions<GetMyRunEventByCommitIdData>): UseDataConnectQueryResult<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
```

### Variables
The `GetMyRunEventByCommitId` Query requires an argument of type `GetMyRunEventByCommitIdVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface GetMyRunEventByCommitIdVariables {
  runId: string;
  commitId: string;
}
```
### Return Type
Recall that calling the `GetMyRunEventByCommitId` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `GetMyRunEventByCommitId` Query is of type `GetMyRunEventByCommitIdData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface GetMyRunEventByCommitIdData {
  userProfile?: {
    id: string;
    events: ({
      id: UUIDString;
      runId: string;
      eventType?: string | null;
      commitId: string;
      clientId: string;
      clientSeq: number;
      triggerType: string;
      triggerPayloadJson: string;
      accepted: boolean;
      errorCode?: string | null;
      message?: string | null;
      seq?: number | null;
      tick?: number | null;
      stateHash?: string | null;
      contentVersion?: string | null;
      createdAt: DateString;
    } & RunEvent_Key)[];
  } & UserProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `GetMyRunEventByCommitId`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, GetMyRunEventByCommitIdVariables } from '@dataconnect/generated';
import { useGetMyRunEventByCommitId } from '@dataconnect/generated/react'

export default function GetMyRunEventByCommitIdComponent() {
  // The `useGetMyRunEventByCommitId` Query hook requires an argument of type `GetMyRunEventByCommitIdVariables`:
  const getMyRunEventByCommitIdVars: GetMyRunEventByCommitIdVariables = {
    runId: ..., 
    commitId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useGetMyRunEventByCommitId(getMyRunEventByCommitIdVars);
  // Variables can be defined inline as well.
  const query = useGetMyRunEventByCommitId({ runId: ..., commitId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useGetMyRunEventByCommitId(dataConnect, getMyRunEventByCommitIdVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyRunEventByCommitId(getMyRunEventByCommitIdVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useGetMyRunEventByCommitId(dataConnect, getMyRunEventByCommitIdVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMyRunEventsSince
You can execute the `ListMyRunEventsSince` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMyRunEventsSince(dc: DataConnect, vars: ListMyRunEventsSinceVariables, options?: useDataConnectQueryOptions<ListMyRunEventsSinceData>): UseDataConnectQueryResult<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMyRunEventsSince(vars: ListMyRunEventsSinceVariables, options?: useDataConnectQueryOptions<ListMyRunEventsSinceData>): UseDataConnectQueryResult<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
```

### Variables
The `ListMyRunEventsSince` Query requires an argument of type `ListMyRunEventsSinceVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListMyRunEventsSinceVariables {
  runId: string;
  afterSeq: number;
}
```
### Return Type
Recall that calling the `ListMyRunEventsSince` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMyRunEventsSince` Query is of type `ListMyRunEventsSinceData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListMyRunEventsSinceData {
  userProfile?: {
    id: string;
    events: ({
      id: UUIDString;
      runId: string;
      eventType?: string | null;
      commitId: string;
      clientId: string;
      clientSeq: number;
      triggerType: string;
      triggerPayloadJson: string;
      accepted: boolean;
      errorCode?: string | null;
      message?: string | null;
      seq?: number | null;
      tick?: number | null;
      stateHash?: string | null;
      contentVersion?: string | null;
      createdAt: DateString;
    } & RunEvent_Key)[];
  } & UserProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMyRunEventsSince`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListMyRunEventsSinceVariables } from '@dataconnect/generated';
import { useListMyRunEventsSince } from '@dataconnect/generated/react'

export default function ListMyRunEventsSinceComponent() {
  // The `useListMyRunEventsSince` Query hook requires an argument of type `ListMyRunEventsSinceVariables`:
  const listMyRunEventsSinceVars: ListMyRunEventsSinceVariables = {
    runId: ..., 
    afterSeq: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMyRunEventsSince(listMyRunEventsSinceVars);
  // Variables can be defined inline as well.
  const query = useListMyRunEventsSince({ runId: ..., afterSeq: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMyRunEventsSince(dataConnect, listMyRunEventsSinceVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMyRunEventsSince(listMyRunEventsSinceVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMyRunEventsSince(dataConnect, listMyRunEventsSinceVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## ListMyStoryMemories
You can execute the `ListMyStoryMemories` Query using the following Query hook function, which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts):

```javascript
useListMyStoryMemories(dc: DataConnect, vars: ListMyStoryMemoriesVariables, options?: useDataConnectQueryOptions<ListMyStoryMemoriesData>): UseDataConnectQueryResult<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useListMyStoryMemories(vars: ListMyStoryMemoriesVariables, options?: useDataConnectQueryOptions<ListMyStoryMemoriesData>): UseDataConnectQueryResult<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
```

### Variables
The `ListMyStoryMemories` Query requires an argument of type `ListMyStoryMemoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface ListMyStoryMemoriesVariables {
  runId: string;
}
```
### Return Type
Recall that calling the `ListMyStoryMemories` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `ListMyStoryMemories` Query is of type `ListMyStoryMemoriesData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface ListMyStoryMemoriesData {
  userProfile?: {
    id: string;
    memories: ({
      id: UUIDString;
      runId: string;
      memoryKey: string;
      memoryJson: string;
      lastSeq?: number | null;
      createdAt: DateString;
      updatedAt: DateString;
    } & StoryMemory_Key)[];
  } & UserProfile_Key;
}
```

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `ListMyStoryMemories`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, ListMyStoryMemoriesVariables } from '@dataconnect/generated';
import { useListMyStoryMemories } from '@dataconnect/generated/react'

export default function ListMyStoryMemoriesComponent() {
  // The `useListMyStoryMemories` Query hook requires an argument of type `ListMyStoryMemoriesVariables`:
  const listMyStoryMemoriesVars: ListMyStoryMemoriesVariables = {
    runId: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useListMyStoryMemories(listMyStoryMemoriesVars);
  // Variables can be defined inline as well.
  const query = useListMyStoryMemories({ runId: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useListMyStoryMemories(dataConnect, listMyStoryMemoriesVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useListMyStoryMemories(listMyStoryMemoriesVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useListMyStoryMemories(dataConnect, listMyStoryMemoriesVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.userProfile);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

The React generated SDK provides Mutations hook functions that call and return [`useDataConnectMutation`](https://react-query-firebase.invertase.dev/react/data-connect/mutations) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, and the most recent data returned by the Mutation, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/mutations).

Mutation hooks do not execute their Mutations automatically when called. Rather, after calling the Mutation hook function and getting a `UseMutationResult` object, you must call the `UseMutationResult.mutate()` function to execute the Mutation.

To learn more about TanStack React Query's Mutations, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations).

## Using Mutation Hooks
Here's a general overview of how to use the generated Mutation hooks in your code:

- Mutation hook functions are not called with the arguments to the Mutation. Instead, arguments are passed to `UseMutationResult.mutate()`.
- If the Mutation has no variables, the `mutate()` function does not require arguments.
- If the Mutation has any required variables, the `mutate()` function will require at least one argument: an object that contains all the required variables for the Mutation.
- If the Mutation has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Mutation's variables are optional, the Mutation hook function does not require any arguments.
- Mutation hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Mutation hooks also accept an `options` argument of type `useDataConnectMutationOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/mutations#mutation-side-effects).
  - `UseMutationResult.mutate()` also accepts an `options` argument of type `useDataConnectMutationOptions`.
  - ***Special case:*** If the Mutation has no arguments (or all optional arguments and you wish to provide none), and you want to pass `options` to `UseMutationResult.mutate()`, you must pass `undefined` where you would normally pass the Mutation's arguments, and then may provide the options argument.

Below are examples of how to use the `example` connector's generated Mutation hook functions to execute each Mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## UpsertMyProfile
You can execute the `UpsertMyProfile` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertMyProfile(options?: useDataConnectMutationOptions<UpsertMyProfileData, FirebaseError, UpsertMyProfileVariables | void>): UseDataConnectMutationResult<UpsertMyProfileData, UpsertMyProfileVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertMyProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertMyProfileData, FirebaseError, UpsertMyProfileVariables | void>): UseDataConnectMutationResult<UpsertMyProfileData, UpsertMyProfileVariables>;
```

### Variables
The `UpsertMyProfile` Mutation has an optional argument of type `UpsertMyProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertMyProfileVariables {
  displayName?: string | null;
}
```
### Return Type
Recall that calling the `UpsertMyProfile` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertMyProfile` Mutation is of type `UpsertMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertMyProfileData {
  userProfile_upsert: UserProfile_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertMyProfile`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertMyProfileVariables } from '@dataconnect/generated';
import { useUpsertMyProfile } from '@dataconnect/generated/react'

export default function UpsertMyProfileComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertMyProfile();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertMyProfile(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertMyProfile(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertMyProfile(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertMyProfile` Mutation has an optional argument of type `UpsertMyProfileVariables`:
  const upsertMyProfileVars: UpsertMyProfileVariables = {
    displayName: ..., // optional
  };
  mutation.mutate(upsertMyProfileVars);
  // Variables can be defined inline as well.
  mutation.mutate({ displayName: ..., });
  // Since all variables are optional for this Mutation, you can omit the `UpsertMyProfileVariables` argument.
  mutation.mutate();

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  // Since all variables are optional for this Mutation, you can provide options without providing any variables.
  // To do so, you must pass `undefined` where you would normally pass the variables.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertMyProfileVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userProfile_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## MarkMyProfileMigration
You can execute the `MarkMyProfileMigration` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useMarkMyProfileMigration(options?: useDataConnectMutationOptions<MarkMyProfileMigrationData, FirebaseError, MarkMyProfileMigrationVariables>): UseDataConnectMutationResult<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useMarkMyProfileMigration(dc: DataConnect, options?: useDataConnectMutationOptions<MarkMyProfileMigrationData, FirebaseError, MarkMyProfileMigrationVariables>): UseDataConnectMutationResult<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
```

### Variables
The `MarkMyProfileMigration` Mutation requires an argument of type `MarkMyProfileMigrationVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface MarkMyProfileMigrationVariables {
  migrationVersion: number;
  displayName?: string | null;
}
```
### Return Type
Recall that calling the `MarkMyProfileMigration` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `MarkMyProfileMigration` Mutation is of type `MarkMyProfileMigrationData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface MarkMyProfileMigrationData {
  userProfile_upsert: UserProfile_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `MarkMyProfileMigration`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, MarkMyProfileMigrationVariables } from '@dataconnect/generated';
import { useMarkMyProfileMigration } from '@dataconnect/generated/react'

export default function MarkMyProfileMigrationComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useMarkMyProfileMigration();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useMarkMyProfileMigration(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkMyProfileMigration(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useMarkMyProfileMigration(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useMarkMyProfileMigration` Mutation requires an argument of type `MarkMyProfileMigrationVariables`:
  const markMyProfileMigrationVars: MarkMyProfileMigrationVariables = {
    migrationVersion: ..., 
    displayName: ..., // optional
  };
  mutation.mutate(markMyProfileMigrationVars);
  // Variables can be defined inline as well.
  mutation.mutate({ migrationVersion: ..., displayName: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(markMyProfileMigrationVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.userProfile_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateSaveSlot
You can execute the `CreateSaveSlot` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateSaveSlot(options?: useDataConnectMutationOptions<CreateSaveSlotData, FirebaseError, CreateSaveSlotVariables>): UseDataConnectMutationResult<CreateSaveSlotData, CreateSaveSlotVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSaveSlotData, FirebaseError, CreateSaveSlotVariables>): UseDataConnectMutationResult<CreateSaveSlotData, CreateSaveSlotVariables>;
```

### Variables
The `CreateSaveSlot` Mutation requires an argument of type `CreateSaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateSaveSlotVariables {
  saveName: string;
  gameStateJson: string;
  playerName: string;
  playerLevel: number;
  worldId: string;
  locationId: string;
  mapId?: string | null;
  playerPosJson?: string | null;
  entityStatesJson?: string | null;
  questFlagsJson?: string | null;
  turnCount: number;
  contentVersion?: string | null;
  stateVersion?: number | null;
  runId?: string | null;
  seq?: number | null;
  tick?: number | null;
  stateHash?: string | null;
}
```
### Return Type
Recall that calling the `CreateSaveSlot` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateSaveSlot` Mutation is of type `CreateSaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateSaveSlotData {
  saveSlot_insert: SaveSlot_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateSaveSlot`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateSaveSlotVariables } from '@dataconnect/generated';
import { useCreateSaveSlot } from '@dataconnect/generated/react'

export default function CreateSaveSlotComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateSaveSlot();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateSaveSlot(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSaveSlot(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateSaveSlot(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateSaveSlot` Mutation requires an argument of type `CreateSaveSlotVariables`:
  const createSaveSlotVars: CreateSaveSlotVariables = {
    saveName: ..., 
    gameStateJson: ..., 
    playerName: ..., 
    playerLevel: ..., 
    worldId: ..., 
    locationId: ..., 
    mapId: ..., // optional
    playerPosJson: ..., // optional
    entityStatesJson: ..., // optional
    questFlagsJson: ..., // optional
    turnCount: ..., 
    contentVersion: ..., // optional
    stateVersion: ..., // optional
    runId: ..., // optional
    seq: ..., // optional
    tick: ..., // optional
    stateHash: ..., // optional
  };
  mutation.mutate(createSaveSlotVars);
  // Variables can be defined inline as well.
  mutation.mutate({ saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createSaveSlotVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.saveSlot_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertSaveSlot
You can execute the `UpsertSaveSlot` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertSaveSlot(options?: useDataConnectMutationOptions<UpsertSaveSlotData, FirebaseError, UpsertSaveSlotVariables>): UseDataConnectMutationResult<UpsertSaveSlotData, UpsertSaveSlotVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertSaveSlotData, FirebaseError, UpsertSaveSlotVariables>): UseDataConnectMutationResult<UpsertSaveSlotData, UpsertSaveSlotVariables>;
```

### Variables
The `UpsertSaveSlot` Mutation requires an argument of type `UpsertSaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertSaveSlotVariables {
  id: UUIDString;
  saveName: string;
  gameStateJson: string;
  playerName: string;
  playerLevel: number;
  worldId: string;
  locationId: string;
  mapId?: string | null;
  playerPosJson?: string | null;
  entityStatesJson?: string | null;
  questFlagsJson?: string | null;
  turnCount: number;
  contentVersion?: string | null;
  stateVersion?: number | null;
  runId?: string | null;
  seq?: number | null;
  tick?: number | null;
  stateHash?: string | null;
}
```
### Return Type
Recall that calling the `UpsertSaveSlot` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertSaveSlot` Mutation is of type `UpsertSaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertSaveSlotData {
  saveSlot_upsert: SaveSlot_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertSaveSlot`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertSaveSlotVariables } from '@dataconnect/generated';
import { useUpsertSaveSlot } from '@dataconnect/generated/react'

export default function UpsertSaveSlotComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertSaveSlot();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertSaveSlot(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertSaveSlot(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertSaveSlot(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertSaveSlot` Mutation requires an argument of type `UpsertSaveSlotVariables`:
  const upsertSaveSlotVars: UpsertSaveSlotVariables = {
    id: ..., 
    saveName: ..., 
    gameStateJson: ..., 
    playerName: ..., 
    playerLevel: ..., 
    worldId: ..., 
    locationId: ..., 
    mapId: ..., // optional
    playerPosJson: ..., // optional
    entityStatesJson: ..., // optional
    questFlagsJson: ..., // optional
    turnCount: ..., 
    contentVersion: ..., // optional
    stateVersion: ..., // optional
    runId: ..., // optional
    seq: ..., // optional
    tick: ..., // optional
    stateHash: ..., // optional
  };
  mutation.mutate(upsertSaveSlotVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertSaveSlotVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.saveSlot_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## DeleteSaveSlot
You can execute the `DeleteSaveSlot` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useDeleteSaveSlot(options?: useDataConnectMutationOptions<DeleteSaveSlotData, FirebaseError, DeleteSaveSlotVariables>): UseDataConnectMutationResult<DeleteSaveSlotData, DeleteSaveSlotVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useDeleteSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSaveSlotData, FirebaseError, DeleteSaveSlotVariables>): UseDataConnectMutationResult<DeleteSaveSlotData, DeleteSaveSlotVariables>;
```

### Variables
The `DeleteSaveSlot` Mutation requires an argument of type `DeleteSaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface DeleteSaveSlotVariables {
  id: UUIDString;
}
```
### Return Type
Recall that calling the `DeleteSaveSlot` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `DeleteSaveSlot` Mutation is of type `DeleteSaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface DeleteSaveSlotData {
  saveSlot_delete?: SaveSlot_Key | null;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `DeleteSaveSlot`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, DeleteSaveSlotVariables } from '@dataconnect/generated';
import { useDeleteSaveSlot } from '@dataconnect/generated/react'

export default function DeleteSaveSlotComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useDeleteSaveSlot();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useDeleteSaveSlot(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteSaveSlot(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useDeleteSaveSlot(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useDeleteSaveSlot` Mutation requires an argument of type `DeleteSaveSlotVariables`:
  const deleteSaveSlotVars: DeleteSaveSlotVariables = {
    id: ..., 
  };
  mutation.mutate(deleteSaveSlotVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(deleteSaveSlotVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.saveSlot_delete);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertRunSession
You can execute the `UpsertRunSession` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertRunSession(options?: useDataConnectMutationOptions<UpsertRunSessionData, FirebaseError, UpsertRunSessionVariables>): UseDataConnectMutationResult<UpsertRunSessionData, UpsertRunSessionVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertRunSession(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertRunSessionData, FirebaseError, UpsertRunSessionVariables>): UseDataConnectMutationResult<UpsertRunSessionData, UpsertRunSessionVariables>;
```

### Variables
The `UpsertRunSession` Mutation requires an argument of type `UpsertRunSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertRunSessionVariables {
  id: UUIDString;
  runId: string;
  worldId: string;
  mapId: string;
  playerPosJson: string;
  entityStatesJson: string;
  questFlagsJson: string;
  seq: number;
  tick: number;
  stateHash: string;
  contentVersion: string;
  stateVersion: number;
  saveSlotId?: UUIDString | null;
  runSeed?: string | null;
  lastCommitId?: string | null;
  lastClientId?: string | null;
}
```
### Return Type
Recall that calling the `UpsertRunSession` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertRunSession` Mutation is of type `UpsertRunSessionData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertRunSessionData {
  runSession_upsert: RunSession_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertRunSession`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertRunSessionVariables } from '@dataconnect/generated';
import { useUpsertRunSession } from '@dataconnect/generated/react'

export default function UpsertRunSessionComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertRunSession();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertRunSession(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertRunSession(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertRunSession(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertRunSession` Mutation requires an argument of type `UpsertRunSessionVariables`:
  const upsertRunSessionVars: UpsertRunSessionVariables = {
    id: ..., 
    runId: ..., 
    worldId: ..., 
    mapId: ..., 
    playerPosJson: ..., 
    entityStatesJson: ..., 
    questFlagsJson: ..., 
    seq: ..., 
    tick: ..., 
    stateHash: ..., 
    contentVersion: ..., 
    stateVersion: ..., 
    saveSlotId: ..., // optional
    runSeed: ..., // optional
    lastCommitId: ..., // optional
    lastClientId: ..., // optional
  };
  mutation.mutate(upsertRunSessionVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., runId: ..., worldId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., seq: ..., tick: ..., stateHash: ..., contentVersion: ..., stateVersion: ..., saveSlotId: ..., runSeed: ..., lastCommitId: ..., lastClientId: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertRunSessionVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.runSession_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## CreateRunEvent
You can execute the `CreateRunEvent` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useCreateRunEvent(options?: useDataConnectMutationOptions<CreateRunEventData, FirebaseError, CreateRunEventVariables>): UseDataConnectMutationResult<CreateRunEventData, CreateRunEventVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useCreateRunEvent(dc: DataConnect, options?: useDataConnectMutationOptions<CreateRunEventData, FirebaseError, CreateRunEventVariables>): UseDataConnectMutationResult<CreateRunEventData, CreateRunEventVariables>;
```

### Variables
The `CreateRunEvent` Mutation requires an argument of type `CreateRunEventVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface CreateRunEventVariables {
  runId: string;
  eventType?: string | null;
  commitId: string;
  clientId: string;
  clientSeq: number;
  triggerType: string;
  triggerPayloadJson: string;
  accepted: boolean;
  errorCode?: string | null;
  message?: string | null;
  seq?: number | null;
  tick?: number | null;
  stateHash?: string | null;
  contentVersion?: string | null;
}
```
### Return Type
Recall that calling the `CreateRunEvent` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `CreateRunEvent` Mutation is of type `CreateRunEventData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface CreateRunEventData {
  runEvent_insert: RunEvent_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `CreateRunEvent`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, CreateRunEventVariables } from '@dataconnect/generated';
import { useCreateRunEvent } from '@dataconnect/generated/react'

export default function CreateRunEventComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useCreateRunEvent();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useCreateRunEvent(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateRunEvent(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useCreateRunEvent(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useCreateRunEvent` Mutation requires an argument of type `CreateRunEventVariables`:
  const createRunEventVars: CreateRunEventVariables = {
    runId: ..., 
    eventType: ..., // optional
    commitId: ..., 
    clientId: ..., 
    clientSeq: ..., 
    triggerType: ..., 
    triggerPayloadJson: ..., 
    accepted: ..., 
    errorCode: ..., // optional
    message: ..., // optional
    seq: ..., // optional
    tick: ..., // optional
    stateHash: ..., // optional
    contentVersion: ..., // optional
  };
  mutation.mutate(createRunEventVars);
  // Variables can be defined inline as well.
  mutation.mutate({ runId: ..., eventType: ..., commitId: ..., clientId: ..., clientSeq: ..., triggerType: ..., triggerPayloadJson: ..., accepted: ..., errorCode: ..., message: ..., seq: ..., tick: ..., stateHash: ..., contentVersion: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(createRunEventVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.runEvent_insert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## UpsertStoryMemory
You can execute the `UpsertStoryMemory` Mutation using the `UseMutationResult` object returned by the following Mutation hook function (which is defined in [dataconnect-generated/react/index.d.ts](./index.d.ts)):
```javascript
useUpsertStoryMemory(options?: useDataConnectMutationOptions<UpsertStoryMemoryData, FirebaseError, UpsertStoryMemoryVariables>): UseDataConnectMutationResult<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
```
You can also pass in a `DataConnect` instance to the Mutation hook function.
```javascript
useUpsertStoryMemory(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertStoryMemoryData, FirebaseError, UpsertStoryMemoryVariables>): UseDataConnectMutationResult<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
```

### Variables
The `UpsertStoryMemory` Mutation requires an argument of type `UpsertStoryMemoryVariables`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface UpsertStoryMemoryVariables {
  id: UUIDString;
  runId: string;
  memoryKey: string;
  memoryJson: string;
  lastSeq?: number | null;
}
```
### Return Type
Recall that calling the `UpsertStoryMemory` Mutation hook function returns a `UseMutationResult` object. This object holds the state of your Mutation, including whether the Mutation is loading, has completed, or has succeeded/failed, among other things.

To check the status of a Mutation, use the `UseMutationResult.status` field. You can also check for pending / success / error status using the `UseMutationResult.isPending`, `UseMutationResult.isSuccess`, and `UseMutationResult.isError` fields.

To execute the Mutation, call `UseMutationResult.mutate()`. This function executes the Mutation, but does not return the data from the Mutation.

To access the data returned by a Mutation, use the `UseMutationResult.data` field. The data for the `UpsertStoryMemory` Mutation is of type `UpsertStoryMemoryData`, which is defined in [dataconnect-generated/index.d.ts](../index.d.ts). It has the following fields:
```javascript
export interface UpsertStoryMemoryData {
  storyMemory_upsert: StoryMemory_Key;
}
```

To learn more about the `UseMutationResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useMutation).

### Using `UpsertStoryMemory`'s Mutation hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, UpsertStoryMemoryVariables } from '@dataconnect/generated';
import { useUpsertStoryMemory } from '@dataconnect/generated/react'

export default function UpsertStoryMemoryComponent() {
  // Call the Mutation hook function to get a `UseMutationResult` object which holds the state of your Mutation.
  const mutation = useUpsertStoryMemory();

  // You can also pass in a `DataConnect` instance to the Mutation hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const mutation = useUpsertStoryMemory(dataConnect);

  // You can also pass in a `useDataConnectMutationOptions` object to the Mutation hook function.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertStoryMemory(options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectMutationOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  const mutation = useUpsertStoryMemory(dataConnect, options);

  // After calling the Mutation hook function, you must call `UseMutationResult.mutate()` to execute the Mutation.
  // The `useUpsertStoryMemory` Mutation requires an argument of type `UpsertStoryMemoryVariables`:
  const upsertStoryMemoryVars: UpsertStoryMemoryVariables = {
    id: ..., 
    runId: ..., 
    memoryKey: ..., 
    memoryJson: ..., 
    lastSeq: ..., // optional
  };
  mutation.mutate(upsertStoryMemoryVars);
  // Variables can be defined inline as well.
  mutation.mutate({ id: ..., runId: ..., memoryKey: ..., memoryJson: ..., lastSeq: ..., });

  // You can also pass in a `useDataConnectMutationOptions` object to `UseMutationResult.mutate()`.
  const options = {
    onSuccess: () => { console.log('Mutation succeeded!'); }
  };
  mutation.mutate(upsertStoryMemoryVars, options);

  // Then, you can render your component dynamically based on the status of the Mutation.
  if (mutation.isPending) {
    return <div>Loading...</div>;
  }

  if (mutation.isError) {
    return <div>Error: {mutation.error.message}</div>;
  }

  // If the Mutation is successful, you can access the data returned using the `UseMutationResult.data` field.
  if (mutation.isSuccess) {
    console.log(mutation.data.storyMemory_upsert);
  }
  return <div>Mutation execution {mutation.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

