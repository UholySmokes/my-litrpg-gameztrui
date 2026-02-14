import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateSaveSlotData {
  saveSlot_insert: SaveSlot_Key;
}

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

export interface DeleteSaveSlotData {
  saveSlot_delete?: SaveSlot_Key | null;
}

export interface DeleteSaveSlotVariables {
  id: UUIDString;
}

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

export interface GetMySaveSlotVariables {
  id: UUIDString;
}

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

export interface ListMyRunSnapshotsVariables {
  runId: string;
}

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

export interface SaveSlot_Key {
  id: UUIDString;
  userId: string;
  __typename?: 'SaveSlot_Key';
}

export interface UpsertMyProfileData {
  userProfile_upsert: UserProfile_Key;
}

export interface UpsertMyProfileVariables {
  displayName: string;
}

export interface UpsertSaveSlotData {
  saveSlot_upsert: SaveSlot_Key;
}

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

export interface UserProfile_Key {
  id: string;
  __typename?: 'UserProfile_Key';
}

interface ListMySaveSlotsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMySaveSlotsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListMySaveSlotsData, undefined>;
  operationName: string;
}
export const listMySaveSlotsRef: ListMySaveSlotsRef;

export function listMySaveSlots(): QueryPromise<ListMySaveSlotsData, undefined>;
export function listMySaveSlots(dc: DataConnect): QueryPromise<ListMySaveSlotsData, undefined>;

interface GetMySaveSlotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMySaveSlotVariables): QueryRef<GetMySaveSlotData, GetMySaveSlotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetMySaveSlotVariables): QueryRef<GetMySaveSlotData, GetMySaveSlotVariables>;
  operationName: string;
}
export const getMySaveSlotRef: GetMySaveSlotRef;

export function getMySaveSlot(vars: GetMySaveSlotVariables): QueryPromise<GetMySaveSlotData, GetMySaveSlotVariables>;
export function getMySaveSlot(dc: DataConnect, vars: GetMySaveSlotVariables): QueryPromise<GetMySaveSlotData, GetMySaveSlotVariables>;

interface ListMyRunSnapshotsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyRunSnapshotsVariables): QueryRef<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListMyRunSnapshotsVariables): QueryRef<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
  operationName: string;
}
export const listMyRunSnapshotsRef: ListMyRunSnapshotsRef;

export function listMyRunSnapshots(vars: ListMyRunSnapshotsVariables): QueryPromise<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
export function listMyRunSnapshots(dc: DataConnect, vars: ListMyRunSnapshotsVariables): QueryPromise<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;

interface UpsertMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
  operationName: string;
}
export const upsertMyProfileRef: UpsertMyProfileRef;

export function upsertMyProfile(vars: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;
export function upsertMyProfile(dc: DataConnect, vars: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;

interface CreateSaveSlotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateSaveSlotVariables): MutationRef<CreateSaveSlotData, CreateSaveSlotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateSaveSlotVariables): MutationRef<CreateSaveSlotData, CreateSaveSlotVariables>;
  operationName: string;
}
export const createSaveSlotRef: CreateSaveSlotRef;

export function createSaveSlot(vars: CreateSaveSlotVariables): MutationPromise<CreateSaveSlotData, CreateSaveSlotVariables>;
export function createSaveSlot(dc: DataConnect, vars: CreateSaveSlotVariables): MutationPromise<CreateSaveSlotData, CreateSaveSlotVariables>;

interface UpsertSaveSlotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertSaveSlotVariables): MutationRef<UpsertSaveSlotData, UpsertSaveSlotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertSaveSlotVariables): MutationRef<UpsertSaveSlotData, UpsertSaveSlotVariables>;
  operationName: string;
}
export const upsertSaveSlotRef: UpsertSaveSlotRef;

export function upsertSaveSlot(vars: UpsertSaveSlotVariables): MutationPromise<UpsertSaveSlotData, UpsertSaveSlotVariables>;
export function upsertSaveSlot(dc: DataConnect, vars: UpsertSaveSlotVariables): MutationPromise<UpsertSaveSlotData, UpsertSaveSlotVariables>;

interface DeleteSaveSlotRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteSaveSlotVariables): MutationRef<DeleteSaveSlotData, DeleteSaveSlotVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteSaveSlotVariables): MutationRef<DeleteSaveSlotData, DeleteSaveSlotVariables>;
  operationName: string;
}
export const deleteSaveSlotRef: DeleteSaveSlotRef;

export function deleteSaveSlot(vars: DeleteSaveSlotVariables): MutationPromise<DeleteSaveSlotData, DeleteSaveSlotVariables>;
export function deleteSaveSlot(dc: DataConnect, vars: DeleteSaveSlotVariables): MutationPromise<DeleteSaveSlotData, DeleteSaveSlotVariables>;

