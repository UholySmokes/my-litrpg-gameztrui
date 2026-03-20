# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
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
  - [*ListAllMyRunSessions*](#listallmyrunsessions)
  - [*ListAllMyRunEvents*](#listallmyrunevents)
  - [*ListMyStoryMemories*](#listmystorymemories)
- [**Mutations**](#mutations)
  - [*UpsertMyProfile*](#upsertmyprofile)
  - [*MarkMyProfileMigration*](#markmyprofilemigration)
  - [*CreateSaveSlot*](#createsaveslot)
  - [*UpsertSaveSlot*](#upsertsaveslot)
  - [*DeleteSaveSlot*](#deletesaveslot)
  - [*DeleteRunSession*](#deleterunsession)
  - [*DeleteRunEvent*](#deleterunevent)
  - [*UpsertRunSession*](#upsertrunsession)
  - [*CreateRunEvent*](#createrunevent)
  - [*UpsertStoryMemory*](#upsertstorymemory)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyProfile
You can execute the `GetMyProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyProfile(): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyProfile(dc: DataConnect): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyProfileRef:
```typescript
const name = getMyProfileRef.operationName;
console.log(name);
```

### Variables
The `GetMyProfile` query has no variables.
### Return Type
Recall that executing the `GetMyProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyProfile } from '@dataconnect/generated';


// Call the `getMyProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyProfile(dataConnect);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
getMyProfile().then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `GetMyProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyProfileRef } from '@dataconnect/generated';


// Call the `getMyProfileRef()` function to get a reference to the query.
const ref = getMyProfileRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyProfileRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## ListMySaveSlots
You can execute the `ListMySaveSlots` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMySaveSlots(vars: ListMySaveSlotsVariables): QueryPromise<ListMySaveSlotsData, ListMySaveSlotsVariables>;

interface ListMySaveSlotsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMySaveSlotsVariables): QueryRef<ListMySaveSlotsData, ListMySaveSlotsVariables>;
}
export const listMySaveSlotsRef: ListMySaveSlotsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMySaveSlots(dc: DataConnect, vars: ListMySaveSlotsVariables): QueryPromise<ListMySaveSlotsData, ListMySaveSlotsVariables>;

interface ListMySaveSlotsRef {
  ...
  (dc: DataConnect, vars: ListMySaveSlotsVariables): QueryRef<ListMySaveSlotsData, ListMySaveSlotsVariables>;
}
export const listMySaveSlotsRef: ListMySaveSlotsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMySaveSlotsRef:
```typescript
const name = listMySaveSlotsRef.operationName;
console.log(name);
```

### Variables
The `ListMySaveSlots` query requires an argument of type `ListMySaveSlotsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMySaveSlotsVariables {
  limit: number;
}
```
### Return Type
Recall that executing the `ListMySaveSlots` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMySaveSlotsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMySaveSlots`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMySaveSlots, ListMySaveSlotsVariables } from '@dataconnect/generated';

// The `ListMySaveSlots` query requires an argument of type `ListMySaveSlotsVariables`:
const listMySaveSlotsVars: ListMySaveSlotsVariables = {
  limit: ..., 
};

// Call the `listMySaveSlots()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMySaveSlots(listMySaveSlotsVars);
// Variables can be defined inline as well.
const { data } = await listMySaveSlots({ limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMySaveSlots(dataConnect, listMySaveSlotsVars);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
listMySaveSlots(listMySaveSlotsVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `ListMySaveSlots`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMySaveSlotsRef, ListMySaveSlotsVariables } from '@dataconnect/generated';

// The `ListMySaveSlots` query requires an argument of type `ListMySaveSlotsVariables`:
const listMySaveSlotsVars: ListMySaveSlotsVariables = {
  limit: ..., 
};

// Call the `listMySaveSlotsRef()` function to get a reference to the query.
const ref = listMySaveSlotsRef(listMySaveSlotsVars);
// Variables can be defined inline as well.
const ref = listMySaveSlotsRef({ limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMySaveSlotsRef(dataConnect, listMySaveSlotsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## GetMySaveSlot
You can execute the `GetMySaveSlot` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMySaveSlot(vars: GetMySaveSlotVariables): QueryPromise<GetMySaveSlotData, GetMySaveSlotVariables>;

interface GetMySaveSlotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMySaveSlotVariables): QueryRef<GetMySaveSlotData, GetMySaveSlotVariables>;
}
export const getMySaveSlotRef: GetMySaveSlotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMySaveSlot(dc: DataConnect, vars: GetMySaveSlotVariables): QueryPromise<GetMySaveSlotData, GetMySaveSlotVariables>;

interface GetMySaveSlotRef {
  ...
  (dc: DataConnect, vars: GetMySaveSlotVariables): QueryRef<GetMySaveSlotData, GetMySaveSlotVariables>;
}
export const getMySaveSlotRef: GetMySaveSlotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMySaveSlotRef:
```typescript
const name = getMySaveSlotRef.operationName;
console.log(name);
```

### Variables
The `GetMySaveSlot` query requires an argument of type `GetMySaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetMySaveSlotVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `GetMySaveSlot` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMySaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMySaveSlotData {
  userProfile?: {
    id: string;
    saveSlots: ({
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
    } & SaveSlot_Key)[];
  } & UserProfile_Key;
}
```
### Using `GetMySaveSlot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMySaveSlot, GetMySaveSlotVariables } from '@dataconnect/generated';

// The `GetMySaveSlot` query requires an argument of type `GetMySaveSlotVariables`:
const getMySaveSlotVars: GetMySaveSlotVariables = {
  id: ..., 
};

// Call the `getMySaveSlot()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMySaveSlot(getMySaveSlotVars);
// Variables can be defined inline as well.
const { data } = await getMySaveSlot({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMySaveSlot(dataConnect, getMySaveSlotVars);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
getMySaveSlot(getMySaveSlotVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `GetMySaveSlot`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMySaveSlotRef, GetMySaveSlotVariables } from '@dataconnect/generated';

// The `GetMySaveSlot` query requires an argument of type `GetMySaveSlotVariables`:
const getMySaveSlotVars: GetMySaveSlotVariables = {
  id: ..., 
};

// Call the `getMySaveSlotRef()` function to get a reference to the query.
const ref = getMySaveSlotRef(getMySaveSlotVars);
// Variables can be defined inline as well.
const ref = getMySaveSlotRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMySaveSlotRef(dataConnect, getMySaveSlotVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## ListMyRunSnapshots
You can execute the `ListMyRunSnapshots` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyRunSnapshots(vars: ListMyRunSnapshotsVariables): QueryPromise<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;

interface ListMyRunSnapshotsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyRunSnapshotsVariables): QueryRef<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
}
export const listMyRunSnapshotsRef: ListMyRunSnapshotsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyRunSnapshots(dc: DataConnect, vars: ListMyRunSnapshotsVariables): QueryPromise<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;

interface ListMyRunSnapshotsRef {
  ...
  (dc: DataConnect, vars: ListMyRunSnapshotsVariables): QueryRef<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
}
export const listMyRunSnapshotsRef: ListMyRunSnapshotsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyRunSnapshotsRef:
```typescript
const name = listMyRunSnapshotsRef.operationName;
console.log(name);
```

### Variables
The `ListMyRunSnapshots` query requires an argument of type `ListMyRunSnapshotsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMyRunSnapshotsVariables {
  runId: string;
}
```
### Return Type
Recall that executing the `ListMyRunSnapshots` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyRunSnapshotsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMyRunSnapshots`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyRunSnapshots, ListMyRunSnapshotsVariables } from '@dataconnect/generated';

// The `ListMyRunSnapshots` query requires an argument of type `ListMyRunSnapshotsVariables`:
const listMyRunSnapshotsVars: ListMyRunSnapshotsVariables = {
  runId: ..., 
};

// Call the `listMyRunSnapshots()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyRunSnapshots(listMyRunSnapshotsVars);
// Variables can be defined inline as well.
const { data } = await listMyRunSnapshots({ runId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyRunSnapshots(dataConnect, listMyRunSnapshotsVars);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
listMyRunSnapshots(listMyRunSnapshotsVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `ListMyRunSnapshots`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyRunSnapshotsRef, ListMyRunSnapshotsVariables } from '@dataconnect/generated';

// The `ListMyRunSnapshots` query requires an argument of type `ListMyRunSnapshotsVariables`:
const listMyRunSnapshotsVars: ListMyRunSnapshotsVariables = {
  runId: ..., 
};

// Call the `listMyRunSnapshotsRef()` function to get a reference to the query.
const ref = listMyRunSnapshotsRef(listMyRunSnapshotsVars);
// Variables can be defined inline as well.
const ref = listMyRunSnapshotsRef({ runId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyRunSnapshotsRef(dataConnect, listMyRunSnapshotsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## GetMyRunSessionByRunId
You can execute the `GetMyRunSessionByRunId` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyRunSessionByRunId(vars: GetMyRunSessionByRunIdVariables): QueryPromise<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;

interface GetMyRunSessionByRunIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMyRunSessionByRunIdVariables): QueryRef<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
}
export const getMyRunSessionByRunIdRef: GetMyRunSessionByRunIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyRunSessionByRunId(dc: DataConnect, vars: GetMyRunSessionByRunIdVariables): QueryPromise<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;

interface GetMyRunSessionByRunIdRef {
  ...
  (dc: DataConnect, vars: GetMyRunSessionByRunIdVariables): QueryRef<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
}
export const getMyRunSessionByRunIdRef: GetMyRunSessionByRunIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyRunSessionByRunIdRef:
```typescript
const name = getMyRunSessionByRunIdRef.operationName;
console.log(name);
```

### Variables
The `GetMyRunSessionByRunId` query requires an argument of type `GetMyRunSessionByRunIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetMyRunSessionByRunIdVariables {
  runId: string;
}
```
### Return Type
Recall that executing the `GetMyRunSessionByRunId` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyRunSessionByRunIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMyRunSessionByRunId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyRunSessionByRunId, GetMyRunSessionByRunIdVariables } from '@dataconnect/generated';

// The `GetMyRunSessionByRunId` query requires an argument of type `GetMyRunSessionByRunIdVariables`:
const getMyRunSessionByRunIdVars: GetMyRunSessionByRunIdVariables = {
  runId: ..., 
};

// Call the `getMyRunSessionByRunId()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyRunSessionByRunId(getMyRunSessionByRunIdVars);
// Variables can be defined inline as well.
const { data } = await getMyRunSessionByRunId({ runId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyRunSessionByRunId(dataConnect, getMyRunSessionByRunIdVars);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
getMyRunSessionByRunId(getMyRunSessionByRunIdVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `GetMyRunSessionByRunId`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyRunSessionByRunIdRef, GetMyRunSessionByRunIdVariables } from '@dataconnect/generated';

// The `GetMyRunSessionByRunId` query requires an argument of type `GetMyRunSessionByRunIdVariables`:
const getMyRunSessionByRunIdVars: GetMyRunSessionByRunIdVariables = {
  runId: ..., 
};

// Call the `getMyRunSessionByRunIdRef()` function to get a reference to the query.
const ref = getMyRunSessionByRunIdRef(getMyRunSessionByRunIdVars);
// Variables can be defined inline as well.
const ref = getMyRunSessionByRunIdRef({ runId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyRunSessionByRunIdRef(dataConnect, getMyRunSessionByRunIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## GetMyRunEventByCommitId
You can execute the `GetMyRunEventByCommitId` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyRunEventByCommitId(vars: GetMyRunEventByCommitIdVariables): QueryPromise<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;

interface GetMyRunEventByCommitIdRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMyRunEventByCommitIdVariables): QueryRef<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
}
export const getMyRunEventByCommitIdRef: GetMyRunEventByCommitIdRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyRunEventByCommitId(dc: DataConnect, vars: GetMyRunEventByCommitIdVariables): QueryPromise<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;

interface GetMyRunEventByCommitIdRef {
  ...
  (dc: DataConnect, vars: GetMyRunEventByCommitIdVariables): QueryRef<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
}
export const getMyRunEventByCommitIdRef: GetMyRunEventByCommitIdRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyRunEventByCommitIdRef:
```typescript
const name = getMyRunEventByCommitIdRef.operationName;
console.log(name);
```

### Variables
The `GetMyRunEventByCommitId` query requires an argument of type `GetMyRunEventByCommitIdVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetMyRunEventByCommitIdVariables {
  runId: string;
  commitId: string;
}
```
### Return Type
Recall that executing the `GetMyRunEventByCommitId` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyRunEventByCommitIdData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `GetMyRunEventByCommitId`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyRunEventByCommitId, GetMyRunEventByCommitIdVariables } from '@dataconnect/generated';

// The `GetMyRunEventByCommitId` query requires an argument of type `GetMyRunEventByCommitIdVariables`:
const getMyRunEventByCommitIdVars: GetMyRunEventByCommitIdVariables = {
  runId: ..., 
  commitId: ..., 
};

// Call the `getMyRunEventByCommitId()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyRunEventByCommitId(getMyRunEventByCommitIdVars);
// Variables can be defined inline as well.
const { data } = await getMyRunEventByCommitId({ runId: ..., commitId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyRunEventByCommitId(dataConnect, getMyRunEventByCommitIdVars);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
getMyRunEventByCommitId(getMyRunEventByCommitIdVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `GetMyRunEventByCommitId`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyRunEventByCommitIdRef, GetMyRunEventByCommitIdVariables } from '@dataconnect/generated';

// The `GetMyRunEventByCommitId` query requires an argument of type `GetMyRunEventByCommitIdVariables`:
const getMyRunEventByCommitIdVars: GetMyRunEventByCommitIdVariables = {
  runId: ..., 
  commitId: ..., 
};

// Call the `getMyRunEventByCommitIdRef()` function to get a reference to the query.
const ref = getMyRunEventByCommitIdRef(getMyRunEventByCommitIdVars);
// Variables can be defined inline as well.
const ref = getMyRunEventByCommitIdRef({ runId: ..., commitId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyRunEventByCommitIdRef(dataConnect, getMyRunEventByCommitIdVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## ListMyRunEventsSince
You can execute the `ListMyRunEventsSince` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyRunEventsSince(vars: ListMyRunEventsSinceVariables): QueryPromise<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;

interface ListMyRunEventsSinceRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyRunEventsSinceVariables): QueryRef<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
}
export const listMyRunEventsSinceRef: ListMyRunEventsSinceRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyRunEventsSince(dc: DataConnect, vars: ListMyRunEventsSinceVariables): QueryPromise<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;

interface ListMyRunEventsSinceRef {
  ...
  (dc: DataConnect, vars: ListMyRunEventsSinceVariables): QueryRef<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
}
export const listMyRunEventsSinceRef: ListMyRunEventsSinceRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyRunEventsSinceRef:
```typescript
const name = listMyRunEventsSinceRef.operationName;
console.log(name);
```

### Variables
The `ListMyRunEventsSince` query requires an argument of type `ListMyRunEventsSinceVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMyRunEventsSinceVariables {
  runId: string;
  afterSeq: number;
}
```
### Return Type
Recall that executing the `ListMyRunEventsSince` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyRunEventsSinceData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMyRunEventsSince`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyRunEventsSince, ListMyRunEventsSinceVariables } from '@dataconnect/generated';

// The `ListMyRunEventsSince` query requires an argument of type `ListMyRunEventsSinceVariables`:
const listMyRunEventsSinceVars: ListMyRunEventsSinceVariables = {
  runId: ..., 
  afterSeq: ..., 
};

// Call the `listMyRunEventsSince()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyRunEventsSince(listMyRunEventsSinceVars);
// Variables can be defined inline as well.
const { data } = await listMyRunEventsSince({ runId: ..., afterSeq: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyRunEventsSince(dataConnect, listMyRunEventsSinceVars);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
listMyRunEventsSince(listMyRunEventsSinceVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `ListMyRunEventsSince`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyRunEventsSinceRef, ListMyRunEventsSinceVariables } from '@dataconnect/generated';

// The `ListMyRunEventsSince` query requires an argument of type `ListMyRunEventsSinceVariables`:
const listMyRunEventsSinceVars: ListMyRunEventsSinceVariables = {
  runId: ..., 
  afterSeq: ..., 
};

// Call the `listMyRunEventsSinceRef()` function to get a reference to the query.
const ref = listMyRunEventsSinceRef(listMyRunEventsSinceVars);
// Variables can be defined inline as well.
const ref = listMyRunEventsSinceRef({ runId: ..., afterSeq: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyRunEventsSinceRef(dataConnect, listMyRunEventsSinceVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## ListAllMyRunSessions
You can execute the `ListAllMyRunSessions` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllMyRunSessions(): QueryPromise<ListAllMyRunSessionsData, undefined>;

interface ListAllMyRunSessionsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllMyRunSessionsData, undefined>;
}
export const listAllMyRunSessionsRef: ListAllMyRunSessionsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllMyRunSessions(dc: DataConnect): QueryPromise<ListAllMyRunSessionsData, undefined>;

interface ListAllMyRunSessionsRef {
  ...
  (dc: DataConnect): QueryRef<ListAllMyRunSessionsData, undefined>;
}
export const listAllMyRunSessionsRef: ListAllMyRunSessionsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllMyRunSessionsRef:
```typescript
const name = listAllMyRunSessionsRef.operationName;
console.log(name);
```

### Variables
The `ListAllMyRunSessions` query has no variables.
### Return Type
Recall that executing the `ListAllMyRunSessions` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllMyRunSessionsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllMyRunSessionsData {
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
### Using `ListAllMyRunSessions`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllMyRunSessions } from '@dataconnect/generated';


// Call the `listAllMyRunSessions()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllMyRunSessions();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllMyRunSessions(dataConnect);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
listAllMyRunSessions().then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `ListAllMyRunSessions`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllMyRunSessionsRef } from '@dataconnect/generated';


// Call the `listAllMyRunSessionsRef()` function to get a reference to the query.
const ref = listAllMyRunSessionsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllMyRunSessionsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## ListAllMyRunEvents
You can execute the `ListAllMyRunEvents` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listAllMyRunEvents(): QueryPromise<ListAllMyRunEventsData, undefined>;

interface ListAllMyRunEventsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllMyRunEventsData, undefined>;
}
export const listAllMyRunEventsRef: ListAllMyRunEventsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listAllMyRunEvents(dc: DataConnect): QueryPromise<ListAllMyRunEventsData, undefined>;

interface ListAllMyRunEventsRef {
  ...
  (dc: DataConnect): QueryRef<ListAllMyRunEventsData, undefined>;
}
export const listAllMyRunEventsRef: ListAllMyRunEventsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listAllMyRunEventsRef:
```typescript
const name = listAllMyRunEventsRef.operationName;
console.log(name);
```

### Variables
The `ListAllMyRunEvents` query has no variables.
### Return Type
Recall that executing the `ListAllMyRunEvents` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListAllMyRunEventsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListAllMyRunEventsData {
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
### Using `ListAllMyRunEvents`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listAllMyRunEvents } from '@dataconnect/generated';


// Call the `listAllMyRunEvents()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listAllMyRunEvents();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listAllMyRunEvents(dataConnect);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
listAllMyRunEvents().then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `ListAllMyRunEvents`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listAllMyRunEventsRef } from '@dataconnect/generated';


// Call the `listAllMyRunEventsRef()` function to get a reference to the query.
const ref = listAllMyRunEventsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listAllMyRunEventsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

## ListMyStoryMemories
You can execute the `ListMyStoryMemories` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyStoryMemories(vars: ListMyStoryMemoriesVariables): QueryPromise<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;

interface ListMyStoryMemoriesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyStoryMemoriesVariables): QueryRef<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
}
export const listMyStoryMemoriesRef: ListMyStoryMemoriesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyStoryMemories(dc: DataConnect, vars: ListMyStoryMemoriesVariables): QueryPromise<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;

interface ListMyStoryMemoriesRef {
  ...
  (dc: DataConnect, vars: ListMyStoryMemoriesVariables): QueryRef<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
}
export const listMyStoryMemoriesRef: ListMyStoryMemoriesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyStoryMemoriesRef:
```typescript
const name = listMyStoryMemoriesRef.operationName;
console.log(name);
```

### Variables
The `ListMyStoryMemories` query requires an argument of type `ListMyStoryMemoriesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListMyStoryMemoriesVariables {
  runId: string;
}
```
### Return Type
Recall that executing the `ListMyStoryMemories` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyStoryMemoriesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
### Using `ListMyStoryMemories`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyStoryMemories, ListMyStoryMemoriesVariables } from '@dataconnect/generated';

// The `ListMyStoryMemories` query requires an argument of type `ListMyStoryMemoriesVariables`:
const listMyStoryMemoriesVars: ListMyStoryMemoriesVariables = {
  runId: ..., 
};

// Call the `listMyStoryMemories()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyStoryMemories(listMyStoryMemoriesVars);
// Variables can be defined inline as well.
const { data } = await listMyStoryMemories({ runId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyStoryMemories(dataConnect, listMyStoryMemoriesVars);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
listMyStoryMemories(listMyStoryMemoriesVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `ListMyStoryMemories`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyStoryMemoriesRef, ListMyStoryMemoriesVariables } from '@dataconnect/generated';

// The `ListMyStoryMemories` query requires an argument of type `ListMyStoryMemoriesVariables`:
const listMyStoryMemoriesVars: ListMyStoryMemoriesVariables = {
  runId: ..., 
};

// Call the `listMyStoryMemoriesRef()` function to get a reference to the query.
const ref = listMyStoryMemoriesRef(listMyStoryMemoriesVars);
// Variables can be defined inline as well.
const ref = listMyStoryMemoriesRef({ runId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyStoryMemoriesRef(dataConnect, listMyStoryMemoriesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## UpsertMyProfile
You can execute the `UpsertMyProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertMyProfile(vars?: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;

interface UpsertMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
}
export const upsertMyProfileRef: UpsertMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertMyProfile(dc: DataConnect, vars?: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;

interface UpsertMyProfileRef {
  ...
  (dc: DataConnect, vars?: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
}
export const upsertMyProfileRef: UpsertMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertMyProfileRef:
```typescript
const name = upsertMyProfileRef.operationName;
console.log(name);
```

### Variables
The `UpsertMyProfile` mutation has an optional argument of type `UpsertMyProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertMyProfileVariables {
  displayName?: string | null;
}
```
### Return Type
Recall that executing the `UpsertMyProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertMyProfileData {
  userProfile_upsert: UserProfile_Key;
}
```
### Using `UpsertMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertMyProfile, UpsertMyProfileVariables } from '@dataconnect/generated';

// The `UpsertMyProfile` mutation has an optional argument of type `UpsertMyProfileVariables`:
const upsertMyProfileVars: UpsertMyProfileVariables = {
  displayName: ..., // optional
};

// Call the `upsertMyProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertMyProfile(upsertMyProfileVars);
// Variables can be defined inline as well.
const { data } = await upsertMyProfile({ displayName: ..., });
// Since all variables are optional for this mutation, you can omit the `UpsertMyProfileVariables` argument.
const { data } = await upsertMyProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertMyProfile(dataConnect, upsertMyProfileVars);

console.log(data.userProfile_upsert);

// Or, you can use the `Promise` API.
upsertMyProfile(upsertMyProfileVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile_upsert);
});
```

### Using `UpsertMyProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertMyProfileRef, UpsertMyProfileVariables } from '@dataconnect/generated';

// The `UpsertMyProfile` mutation has an optional argument of type `UpsertMyProfileVariables`:
const upsertMyProfileVars: UpsertMyProfileVariables = {
  displayName: ..., // optional
};

// Call the `upsertMyProfileRef()` function to get a reference to the mutation.
const ref = upsertMyProfileRef(upsertMyProfileVars);
// Variables can be defined inline as well.
const ref = upsertMyProfileRef({ displayName: ..., });
// Since all variables are optional for this mutation, you can omit the `UpsertMyProfileVariables` argument.
const ref = upsertMyProfileRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertMyProfileRef(dataConnect, upsertMyProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userProfile_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile_upsert);
});
```

## MarkMyProfileMigration
You can execute the `MarkMyProfileMigration` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
markMyProfileMigration(vars: MarkMyProfileMigrationVariables): MutationPromise<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;

interface MarkMyProfileMigrationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkMyProfileMigrationVariables): MutationRef<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
}
export const markMyProfileMigrationRef: MarkMyProfileMigrationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
markMyProfileMigration(dc: DataConnect, vars: MarkMyProfileMigrationVariables): MutationPromise<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;

interface MarkMyProfileMigrationRef {
  ...
  (dc: DataConnect, vars: MarkMyProfileMigrationVariables): MutationRef<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
}
export const markMyProfileMigrationRef: MarkMyProfileMigrationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the markMyProfileMigrationRef:
```typescript
const name = markMyProfileMigrationRef.operationName;
console.log(name);
```

### Variables
The `MarkMyProfileMigration` mutation requires an argument of type `MarkMyProfileMigrationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface MarkMyProfileMigrationVariables {
  migrationVersion: number;
  displayName?: string | null;
}
```
### Return Type
Recall that executing the `MarkMyProfileMigration` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `MarkMyProfileMigrationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface MarkMyProfileMigrationData {
  userProfile_upsert: UserProfile_Key;
}
```
### Using `MarkMyProfileMigration`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, markMyProfileMigration, MarkMyProfileMigrationVariables } from '@dataconnect/generated';

// The `MarkMyProfileMigration` mutation requires an argument of type `MarkMyProfileMigrationVariables`:
const markMyProfileMigrationVars: MarkMyProfileMigrationVariables = {
  migrationVersion: ..., 
  displayName: ..., // optional
};

// Call the `markMyProfileMigration()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await markMyProfileMigration(markMyProfileMigrationVars);
// Variables can be defined inline as well.
const { data } = await markMyProfileMigration({ migrationVersion: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await markMyProfileMigration(dataConnect, markMyProfileMigrationVars);

console.log(data.userProfile_upsert);

// Or, you can use the `Promise` API.
markMyProfileMigration(markMyProfileMigrationVars).then((response) => {
  const data = response.data;
  console.log(data.userProfile_upsert);
});
```

### Using `MarkMyProfileMigration`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, markMyProfileMigrationRef, MarkMyProfileMigrationVariables } from '@dataconnect/generated';

// The `MarkMyProfileMigration` mutation requires an argument of type `MarkMyProfileMigrationVariables`:
const markMyProfileMigrationVars: MarkMyProfileMigrationVariables = {
  migrationVersion: ..., 
  displayName: ..., // optional
};

// Call the `markMyProfileMigrationRef()` function to get a reference to the mutation.
const ref = markMyProfileMigrationRef(markMyProfileMigrationVars);
// Variables can be defined inline as well.
const ref = markMyProfileMigrationRef({ migrationVersion: ..., displayName: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = markMyProfileMigrationRef(dataConnect, markMyProfileMigrationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.userProfile_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.userProfile_upsert);
});
```

## CreateSaveSlot
You can execute the `CreateSaveSlot` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createSaveSlot(vars: CreateSaveSlotVariables): MutationPromise<CreateSaveSlotData, CreateSaveSlotVariables>;

interface CreateSaveSlotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSaveSlotVariables): MutationRef<CreateSaveSlotData, CreateSaveSlotVariables>;
}
export const createSaveSlotRef: CreateSaveSlotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createSaveSlot(dc: DataConnect, vars: CreateSaveSlotVariables): MutationPromise<CreateSaveSlotData, CreateSaveSlotVariables>;

interface CreateSaveSlotRef {
  ...
  (dc: DataConnect, vars: CreateSaveSlotVariables): MutationRef<CreateSaveSlotData, CreateSaveSlotVariables>;
}
export const createSaveSlotRef: CreateSaveSlotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createSaveSlotRef:
```typescript
const name = createSaveSlotRef.operationName;
console.log(name);
```

### Variables
The `CreateSaveSlot` mutation requires an argument of type `CreateSaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateSaveSlot` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateSaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateSaveSlotData {
  saveSlot_insert: SaveSlot_Key;
}
```
### Using `CreateSaveSlot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createSaveSlot, CreateSaveSlotVariables } from '@dataconnect/generated';

// The `CreateSaveSlot` mutation requires an argument of type `CreateSaveSlotVariables`:
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

// Call the `createSaveSlot()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createSaveSlot(createSaveSlotVars);
// Variables can be defined inline as well.
const { data } = await createSaveSlot({ saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createSaveSlot(dataConnect, createSaveSlotVars);

console.log(data.saveSlot_insert);

// Or, you can use the `Promise` API.
createSaveSlot(createSaveSlotVars).then((response) => {
  const data = response.data;
  console.log(data.saveSlot_insert);
});
```

### Using `CreateSaveSlot`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createSaveSlotRef, CreateSaveSlotVariables } from '@dataconnect/generated';

// The `CreateSaveSlot` mutation requires an argument of type `CreateSaveSlotVariables`:
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

// Call the `createSaveSlotRef()` function to get a reference to the mutation.
const ref = createSaveSlotRef(createSaveSlotVars);
// Variables can be defined inline as well.
const ref = createSaveSlotRef({ saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createSaveSlotRef(dataConnect, createSaveSlotVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.saveSlot_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.saveSlot_insert);
});
```

## UpsertSaveSlot
You can execute the `UpsertSaveSlot` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertSaveSlot(vars: UpsertSaveSlotVariables): MutationPromise<UpsertSaveSlotData, UpsertSaveSlotVariables>;

interface UpsertSaveSlotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertSaveSlotVariables): MutationRef<UpsertSaveSlotData, UpsertSaveSlotVariables>;
}
export const upsertSaveSlotRef: UpsertSaveSlotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertSaveSlot(dc: DataConnect, vars: UpsertSaveSlotVariables): MutationPromise<UpsertSaveSlotData, UpsertSaveSlotVariables>;

interface UpsertSaveSlotRef {
  ...
  (dc: DataConnect, vars: UpsertSaveSlotVariables): MutationRef<UpsertSaveSlotData, UpsertSaveSlotVariables>;
}
export const upsertSaveSlotRef: UpsertSaveSlotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertSaveSlotRef:
```typescript
const name = upsertSaveSlotRef.operationName;
console.log(name);
```

### Variables
The `UpsertSaveSlot` mutation requires an argument of type `UpsertSaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertSaveSlot` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertSaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertSaveSlotData {
  saveSlot_upsert: SaveSlot_Key;
}
```
### Using `UpsertSaveSlot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertSaveSlot, UpsertSaveSlotVariables } from '@dataconnect/generated';

// The `UpsertSaveSlot` mutation requires an argument of type `UpsertSaveSlotVariables`:
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

// Call the `upsertSaveSlot()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertSaveSlot(upsertSaveSlotVars);
// Variables can be defined inline as well.
const { data } = await upsertSaveSlot({ id: ..., saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertSaveSlot(dataConnect, upsertSaveSlotVars);

console.log(data.saveSlot_upsert);

// Or, you can use the `Promise` API.
upsertSaveSlot(upsertSaveSlotVars).then((response) => {
  const data = response.data;
  console.log(data.saveSlot_upsert);
});
```

### Using `UpsertSaveSlot`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertSaveSlotRef, UpsertSaveSlotVariables } from '@dataconnect/generated';

// The `UpsertSaveSlot` mutation requires an argument of type `UpsertSaveSlotVariables`:
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

// Call the `upsertSaveSlotRef()` function to get a reference to the mutation.
const ref = upsertSaveSlotRef(upsertSaveSlotVars);
// Variables can be defined inline as well.
const ref = upsertSaveSlotRef({ id: ..., saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertSaveSlotRef(dataConnect, upsertSaveSlotVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.saveSlot_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.saveSlot_upsert);
});
```

## DeleteSaveSlot
You can execute the `DeleteSaveSlot` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteSaveSlot(vars: DeleteSaveSlotVariables): MutationPromise<DeleteSaveSlotData, DeleteSaveSlotVariables>;

interface DeleteSaveSlotRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSaveSlotVariables): MutationRef<DeleteSaveSlotData, DeleteSaveSlotVariables>;
}
export const deleteSaveSlotRef: DeleteSaveSlotRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteSaveSlot(dc: DataConnect, vars: DeleteSaveSlotVariables): MutationPromise<DeleteSaveSlotData, DeleteSaveSlotVariables>;

interface DeleteSaveSlotRef {
  ...
  (dc: DataConnect, vars: DeleteSaveSlotVariables): MutationRef<DeleteSaveSlotData, DeleteSaveSlotVariables>;
}
export const deleteSaveSlotRef: DeleteSaveSlotRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteSaveSlotRef:
```typescript
const name = deleteSaveSlotRef.operationName;
console.log(name);
```

### Variables
The `DeleteSaveSlot` mutation requires an argument of type `DeleteSaveSlotVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteSaveSlotVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteSaveSlot` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteSaveSlotData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteSaveSlotData {
  saveSlot_delete?: SaveSlot_Key | null;
}
```
### Using `DeleteSaveSlot`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteSaveSlot, DeleteSaveSlotVariables } from '@dataconnect/generated';

// The `DeleteSaveSlot` mutation requires an argument of type `DeleteSaveSlotVariables`:
const deleteSaveSlotVars: DeleteSaveSlotVariables = {
  id: ..., 
};

// Call the `deleteSaveSlot()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteSaveSlot(deleteSaveSlotVars);
// Variables can be defined inline as well.
const { data } = await deleteSaveSlot({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteSaveSlot(dataConnect, deleteSaveSlotVars);

console.log(data.saveSlot_delete);

// Or, you can use the `Promise` API.
deleteSaveSlot(deleteSaveSlotVars).then((response) => {
  const data = response.data;
  console.log(data.saveSlot_delete);
});
```

### Using `DeleteSaveSlot`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteSaveSlotRef, DeleteSaveSlotVariables } from '@dataconnect/generated';

// The `DeleteSaveSlot` mutation requires an argument of type `DeleteSaveSlotVariables`:
const deleteSaveSlotVars: DeleteSaveSlotVariables = {
  id: ..., 
};

// Call the `deleteSaveSlotRef()` function to get a reference to the mutation.
const ref = deleteSaveSlotRef(deleteSaveSlotVars);
// Variables can be defined inline as well.
const ref = deleteSaveSlotRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteSaveSlotRef(dataConnect, deleteSaveSlotVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.saveSlot_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.saveSlot_delete);
});
```

## DeleteRunSession
You can execute the `DeleteRunSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteRunSession(vars: DeleteRunSessionVariables): MutationPromise<DeleteRunSessionData, DeleteRunSessionVariables>;

interface DeleteRunSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRunSessionVariables): MutationRef<DeleteRunSessionData, DeleteRunSessionVariables>;
}
export const deleteRunSessionRef: DeleteRunSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteRunSession(dc: DataConnect, vars: DeleteRunSessionVariables): MutationPromise<DeleteRunSessionData, DeleteRunSessionVariables>;

interface DeleteRunSessionRef {
  ...
  (dc: DataConnect, vars: DeleteRunSessionVariables): MutationRef<DeleteRunSessionData, DeleteRunSessionVariables>;
}
export const deleteRunSessionRef: DeleteRunSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteRunSessionRef:
```typescript
const name = deleteRunSessionRef.operationName;
console.log(name);
```

### Variables
The `DeleteRunSession` mutation requires an argument of type `DeleteRunSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteRunSessionVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteRunSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteRunSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteRunSessionData {
  runSession_delete?: RunSession_Key | null;
}
```
### Using `DeleteRunSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteRunSession, DeleteRunSessionVariables } from '@dataconnect/generated';

// The `DeleteRunSession` mutation requires an argument of type `DeleteRunSessionVariables`:
const deleteRunSessionVars: DeleteRunSessionVariables = {
  id: ..., 
};

// Call the `deleteRunSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteRunSession(deleteRunSessionVars);
// Variables can be defined inline as well.
const { data } = await deleteRunSession({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteRunSession(dataConnect, deleteRunSessionVars);

console.log(data.runSession_delete);

// Or, you can use the `Promise` API.
deleteRunSession(deleteRunSessionVars).then((response) => {
  const data = response.data;
  console.log(data.runSession_delete);
});
```

### Using `DeleteRunSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteRunSessionRef, DeleteRunSessionVariables } from '@dataconnect/generated';

// The `DeleteRunSession` mutation requires an argument of type `DeleteRunSessionVariables`:
const deleteRunSessionVars: DeleteRunSessionVariables = {
  id: ..., 
};

// Call the `deleteRunSessionRef()` function to get a reference to the mutation.
const ref = deleteRunSessionRef(deleteRunSessionVars);
// Variables can be defined inline as well.
const ref = deleteRunSessionRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteRunSessionRef(dataConnect, deleteRunSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.runSession_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.runSession_delete);
});
```

## DeleteRunEvent
You can execute the `DeleteRunEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deleteRunEvent(vars: DeleteRunEventVariables): MutationPromise<DeleteRunEventData, DeleteRunEventVariables>;

interface DeleteRunEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRunEventVariables): MutationRef<DeleteRunEventData, DeleteRunEventVariables>;
}
export const deleteRunEventRef: DeleteRunEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deleteRunEvent(dc: DataConnect, vars: DeleteRunEventVariables): MutationPromise<DeleteRunEventData, DeleteRunEventVariables>;

interface DeleteRunEventRef {
  ...
  (dc: DataConnect, vars: DeleteRunEventVariables): MutationRef<DeleteRunEventData, DeleteRunEventVariables>;
}
export const deleteRunEventRef: DeleteRunEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deleteRunEventRef:
```typescript
const name = deleteRunEventRef.operationName;
console.log(name);
```

### Variables
The `DeleteRunEvent` mutation requires an argument of type `DeleteRunEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeleteRunEventVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeleteRunEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeleteRunEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeleteRunEventData {
  runEvent_delete?: RunEvent_Key | null;
}
```
### Using `DeleteRunEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deleteRunEvent, DeleteRunEventVariables } from '@dataconnect/generated';

// The `DeleteRunEvent` mutation requires an argument of type `DeleteRunEventVariables`:
const deleteRunEventVars: DeleteRunEventVariables = {
  id: ..., 
};

// Call the `deleteRunEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deleteRunEvent(deleteRunEventVars);
// Variables can be defined inline as well.
const { data } = await deleteRunEvent({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deleteRunEvent(dataConnect, deleteRunEventVars);

console.log(data.runEvent_delete);

// Or, you can use the `Promise` API.
deleteRunEvent(deleteRunEventVars).then((response) => {
  const data = response.data;
  console.log(data.runEvent_delete);
});
```

### Using `DeleteRunEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deleteRunEventRef, DeleteRunEventVariables } from '@dataconnect/generated';

// The `DeleteRunEvent` mutation requires an argument of type `DeleteRunEventVariables`:
const deleteRunEventVars: DeleteRunEventVariables = {
  id: ..., 
};

// Call the `deleteRunEventRef()` function to get a reference to the mutation.
const ref = deleteRunEventRef(deleteRunEventVars);
// Variables can be defined inline as well.
const ref = deleteRunEventRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deleteRunEventRef(dataConnect, deleteRunEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.runEvent_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.runEvent_delete);
});
```

## UpsertRunSession
You can execute the `UpsertRunSession` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertRunSession(vars: UpsertRunSessionVariables): MutationPromise<UpsertRunSessionData, UpsertRunSessionVariables>;

interface UpsertRunSessionRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertRunSessionVariables): MutationRef<UpsertRunSessionData, UpsertRunSessionVariables>;
}
export const upsertRunSessionRef: UpsertRunSessionRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertRunSession(dc: DataConnect, vars: UpsertRunSessionVariables): MutationPromise<UpsertRunSessionData, UpsertRunSessionVariables>;

interface UpsertRunSessionRef {
  ...
  (dc: DataConnect, vars: UpsertRunSessionVariables): MutationRef<UpsertRunSessionData, UpsertRunSessionVariables>;
}
export const upsertRunSessionRef: UpsertRunSessionRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertRunSessionRef:
```typescript
const name = upsertRunSessionRef.operationName;
console.log(name);
```

### Variables
The `UpsertRunSession` mutation requires an argument of type `UpsertRunSessionVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `UpsertRunSession` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertRunSessionData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertRunSessionData {
  runSession_upsert: RunSession_Key;
}
```
### Using `UpsertRunSession`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertRunSession, UpsertRunSessionVariables } from '@dataconnect/generated';

// The `UpsertRunSession` mutation requires an argument of type `UpsertRunSessionVariables`:
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

// Call the `upsertRunSession()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertRunSession(upsertRunSessionVars);
// Variables can be defined inline as well.
const { data } = await upsertRunSession({ id: ..., runId: ..., worldId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., seq: ..., tick: ..., stateHash: ..., contentVersion: ..., stateVersion: ..., saveSlotId: ..., runSeed: ..., lastCommitId: ..., lastClientId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertRunSession(dataConnect, upsertRunSessionVars);

console.log(data.runSession_upsert);

// Or, you can use the `Promise` API.
upsertRunSession(upsertRunSessionVars).then((response) => {
  const data = response.data;
  console.log(data.runSession_upsert);
});
```

### Using `UpsertRunSession`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertRunSessionRef, UpsertRunSessionVariables } from '@dataconnect/generated';

// The `UpsertRunSession` mutation requires an argument of type `UpsertRunSessionVariables`:
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

// Call the `upsertRunSessionRef()` function to get a reference to the mutation.
const ref = upsertRunSessionRef(upsertRunSessionVars);
// Variables can be defined inline as well.
const ref = upsertRunSessionRef({ id: ..., runId: ..., worldId: ..., mapId: ..., playerPosJson: ..., entityStatesJson: ..., questFlagsJson: ..., seq: ..., tick: ..., stateHash: ..., contentVersion: ..., stateVersion: ..., saveSlotId: ..., runSeed: ..., lastCommitId: ..., lastClientId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertRunSessionRef(dataConnect, upsertRunSessionVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.runSession_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.runSession_upsert);
});
```

## CreateRunEvent
You can execute the `CreateRunEvent` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createRunEvent(vars: CreateRunEventVariables): MutationPromise<CreateRunEventData, CreateRunEventVariables>;

interface CreateRunEventRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRunEventVariables): MutationRef<CreateRunEventData, CreateRunEventVariables>;
}
export const createRunEventRef: CreateRunEventRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createRunEvent(dc: DataConnect, vars: CreateRunEventVariables): MutationPromise<CreateRunEventData, CreateRunEventVariables>;

interface CreateRunEventRef {
  ...
  (dc: DataConnect, vars: CreateRunEventVariables): MutationRef<CreateRunEventData, CreateRunEventVariables>;
}
export const createRunEventRef: CreateRunEventRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createRunEventRef:
```typescript
const name = createRunEventRef.operationName;
console.log(name);
```

### Variables
The `CreateRunEvent` mutation requires an argument of type `CreateRunEventVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
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
Recall that executing the `CreateRunEvent` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateRunEventData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateRunEventData {
  runEvent_insert: RunEvent_Key;
}
```
### Using `CreateRunEvent`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createRunEvent, CreateRunEventVariables } from '@dataconnect/generated';

// The `CreateRunEvent` mutation requires an argument of type `CreateRunEventVariables`:
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

// Call the `createRunEvent()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createRunEvent(createRunEventVars);
// Variables can be defined inline as well.
const { data } = await createRunEvent({ runId: ..., eventType: ..., commitId: ..., clientId: ..., clientSeq: ..., triggerType: ..., triggerPayloadJson: ..., accepted: ..., errorCode: ..., message: ..., seq: ..., tick: ..., stateHash: ..., contentVersion: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createRunEvent(dataConnect, createRunEventVars);

console.log(data.runEvent_insert);

// Or, you can use the `Promise` API.
createRunEvent(createRunEventVars).then((response) => {
  const data = response.data;
  console.log(data.runEvent_insert);
});
```

### Using `CreateRunEvent`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createRunEventRef, CreateRunEventVariables } from '@dataconnect/generated';

// The `CreateRunEvent` mutation requires an argument of type `CreateRunEventVariables`:
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

// Call the `createRunEventRef()` function to get a reference to the mutation.
const ref = createRunEventRef(createRunEventVars);
// Variables can be defined inline as well.
const ref = createRunEventRef({ runId: ..., eventType: ..., commitId: ..., clientId: ..., clientSeq: ..., triggerType: ..., triggerPayloadJson: ..., accepted: ..., errorCode: ..., message: ..., seq: ..., tick: ..., stateHash: ..., contentVersion: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createRunEventRef(dataConnect, createRunEventVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.runEvent_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.runEvent_insert);
});
```

## UpsertStoryMemory
You can execute the `UpsertStoryMemory` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
upsertStoryMemory(vars: UpsertStoryMemoryVariables): MutationPromise<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;

interface UpsertStoryMemoryRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertStoryMemoryVariables): MutationRef<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
}
export const upsertStoryMemoryRef: UpsertStoryMemoryRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertStoryMemory(dc: DataConnect, vars: UpsertStoryMemoryVariables): MutationPromise<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;

interface UpsertStoryMemoryRef {
  ...
  (dc: DataConnect, vars: UpsertStoryMemoryVariables): MutationRef<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
}
export const upsertStoryMemoryRef: UpsertStoryMemoryRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertStoryMemoryRef:
```typescript
const name = upsertStoryMemoryRef.operationName;
console.log(name);
```

### Variables
The `UpsertStoryMemory` mutation requires an argument of type `UpsertStoryMemoryVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertStoryMemoryVariables {
  id: UUIDString;
  runId: string;
  memoryKey: string;
  memoryJson: string;
  lastSeq?: number | null;
}
```
### Return Type
Recall that executing the `UpsertStoryMemory` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpsertStoryMemoryData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpsertStoryMemoryData {
  storyMemory_upsert: StoryMemory_Key;
}
```
### Using `UpsertStoryMemory`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, upsertStoryMemory, UpsertStoryMemoryVariables } from '@dataconnect/generated';

// The `UpsertStoryMemory` mutation requires an argument of type `UpsertStoryMemoryVariables`:
const upsertStoryMemoryVars: UpsertStoryMemoryVariables = {
  id: ..., 
  runId: ..., 
  memoryKey: ..., 
  memoryJson: ..., 
  lastSeq: ..., // optional
};

// Call the `upsertStoryMemory()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertStoryMemory(upsertStoryMemoryVars);
// Variables can be defined inline as well.
const { data } = await upsertStoryMemory({ id: ..., runId: ..., memoryKey: ..., memoryJson: ..., lastSeq: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await upsertStoryMemory(dataConnect, upsertStoryMemoryVars);

console.log(data.storyMemory_upsert);

// Or, you can use the `Promise` API.
upsertStoryMemory(upsertStoryMemoryVars).then((response) => {
  const data = response.data;
  console.log(data.storyMemory_upsert);
});
```

### Using `UpsertStoryMemory`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, upsertStoryMemoryRef, UpsertStoryMemoryVariables } from '@dataconnect/generated';

// The `UpsertStoryMemory` mutation requires an argument of type `UpsertStoryMemoryVariables`:
const upsertStoryMemoryVars: UpsertStoryMemoryVariables = {
  id: ..., 
  runId: ..., 
  memoryKey: ..., 
  memoryJson: ..., 
  lastSeq: ..., // optional
};

// Call the `upsertStoryMemoryRef()` function to get a reference to the mutation.
const ref = upsertStoryMemoryRef(upsertStoryMemoryVars);
// Variables can be defined inline as well.
const ref = upsertStoryMemoryRef({ id: ..., runId: ..., memoryKey: ..., memoryJson: ..., lastSeq: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = upsertStoryMemoryRef(dataConnect, upsertStoryMemoryVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.storyMemory_upsert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.storyMemory_upsert);
});
```

