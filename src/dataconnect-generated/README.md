# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListMySaveSlots*](#listmysaveslots)
  - [*GetMySaveSlot*](#getmysaveslot)
  - [*ListMyRunSnapshots*](#listmyrunsnapshots)
- [**Mutations**](#mutations)
  - [*UpsertMyProfile*](#upsertmyprofile)
  - [*CreateSaveSlot*](#createsaveslot)
  - [*UpsertSaveSlot*](#upsertsaveslot)
  - [*DeleteSaveSlot*](#deletesaveslot)

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

## ListMySaveSlots
You can execute the `ListMySaveSlots` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMySaveSlots(): QueryPromise<ListMySaveSlotsData, undefined>;

interface ListMySaveSlotsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMySaveSlotsData, undefined>;
}
export const listMySaveSlotsRef: ListMySaveSlotsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMySaveSlots(dc: DataConnect): QueryPromise<ListMySaveSlotsData, undefined>;

interface ListMySaveSlotsRef {
  ...
  (dc: DataConnect): QueryRef<ListMySaveSlotsData, undefined>;
}
export const listMySaveSlotsRef: ListMySaveSlotsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMySaveSlotsRef:
```typescript
const name = listMySaveSlotsRef.operationName;
console.log(name);
```

### Variables
The `ListMySaveSlots` query has no variables.
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
      turnCount: number;
      contentVersion?: string | null;
      stateVersion?: number | null;
      runId?: string | null;
      seq?: number | null;
      tick?: number | null;
      stateHash?: string | null;
      createdAt: DateString;
      updatedAt: DateString;
    })[];
  } & UserProfile_Key;
}
```
### Using `ListMySaveSlots`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMySaveSlots } from '@dataconnect/generated';


// Call the `listMySaveSlots()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMySaveSlots();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMySaveSlots(dataConnect);

console.log(data.userProfile);

// Or, you can use the `Promise` API.
listMySaveSlots().then((response) => {
  const data = response.data;
  console.log(data.userProfile);
});
```

### Using `ListMySaveSlots`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMySaveSlotsRef } from '@dataconnect/generated';


// Call the `listMySaveSlotsRef()` function to get a reference to the query.
const ref = listMySaveSlotsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMySaveSlotsRef(dataConnect);

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
  saveSlot?: {
    id: UUIDString;
    saveName: string;
    gameStateJson: string;
    playerName: string;
    playerLevel: number;
    worldId: string;
    locationId: string;
    turnCount: number;
    contentVersion?: string | null;
    stateVersion?: number | null;
    runId?: string | null;
    seq?: number | null;
    tick?: number | null;
    stateHash?: string | null;
    createdAt: DateString;
    updatedAt: DateString;
  };
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

console.log(data.saveSlot);

// Or, you can use the `Promise` API.
getMySaveSlot(getMySaveSlotVars).then((response) => {
  const data = response.data;
  console.log(data.saveSlot);
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

console.log(data.saveSlot);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.saveSlot);
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
    })[];
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
upsertMyProfile(vars: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;

interface UpsertMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
}
export const upsertMyProfileRef: UpsertMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
upsertMyProfile(dc: DataConnect, vars: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;

interface UpsertMyProfileRef {
  ...
  (dc: DataConnect, vars: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
}
export const upsertMyProfileRef: UpsertMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the upsertMyProfileRef:
```typescript
const name = upsertMyProfileRef.operationName;
console.log(name);
```

### Variables
The `UpsertMyProfile` mutation requires an argument of type `UpsertMyProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpsertMyProfileVariables {
  displayName: string;
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

// The `UpsertMyProfile` mutation requires an argument of type `UpsertMyProfileVariables`:
const upsertMyProfileVars: UpsertMyProfileVariables = {
  displayName: ..., 
};

// Call the `upsertMyProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await upsertMyProfile(upsertMyProfileVars);
// Variables can be defined inline as well.
const { data } = await upsertMyProfile({ displayName: ..., });

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

// The `UpsertMyProfile` mutation requires an argument of type `UpsertMyProfileVariables`:
const upsertMyProfileVars: UpsertMyProfileVariables = {
  displayName: ..., 
};

// Call the `upsertMyProfileRef()` function to get a reference to the mutation.
const ref = upsertMyProfileRef(upsertMyProfileVars);
// Variables can be defined inline as well.
const ref = upsertMyProfileRef({ displayName: ..., });

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
const { data } = await createSaveSlot({ saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

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
const ref = createSaveSlotRef({ saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

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
const { data } = await upsertSaveSlot({ id: ..., saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

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
const ref = upsertSaveSlotRef({ id: ..., saveName: ..., gameStateJson: ..., playerName: ..., playerLevel: ..., worldId: ..., locationId: ..., turnCount: ..., contentVersion: ..., stateVersion: ..., runId: ..., seq: ..., tick: ..., stateHash: ..., });

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

