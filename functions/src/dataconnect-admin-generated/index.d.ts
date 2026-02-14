import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

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

/** Generated Node Admin SDK operation action function for the 'ListMySaveSlots' Query. Allow users to execute without passing in DataConnect. */
export function listMySaveSlots(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMySaveSlotsData>>;
/** Generated Node Admin SDK operation action function for the 'ListMySaveSlots' Query. Allow users to pass in custom DataConnect instances. */
export function listMySaveSlots(options?: OperationOptions): Promise<ExecuteOperationResponse<ListMySaveSlotsData>>;

/** Generated Node Admin SDK operation action function for the 'GetMySaveSlot' Query. Allow users to execute without passing in DataConnect. */
export function getMySaveSlot(dc: DataConnect, vars: GetMySaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMySaveSlotData>>;
/** Generated Node Admin SDK operation action function for the 'GetMySaveSlot' Query. Allow users to pass in custom DataConnect instances. */
export function getMySaveSlot(vars: GetMySaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMySaveSlotData>>;

/** Generated Node Admin SDK operation action function for the 'ListMyRunSnapshots' Query. Allow users to execute without passing in DataConnect. */
export function listMyRunSnapshots(dc: DataConnect, vars: ListMyRunSnapshotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyRunSnapshotsData>>;
/** Generated Node Admin SDK operation action function for the 'ListMyRunSnapshots' Query. Allow users to pass in custom DataConnect instances. */
export function listMyRunSnapshots(vars: ListMyRunSnapshotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyRunSnapshotsData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertMyProfile' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertMyProfile(dc: DataConnect, vars: UpsertMyProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertMyProfileData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertMyProfile' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertMyProfile(vars: UpsertMyProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertMyProfileData>>;

/** Generated Node Admin SDK operation action function for the 'CreateSaveSlot' Mutation. Allow users to execute without passing in DataConnect. */
export function createSaveSlot(dc: DataConnect, vars: CreateSaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSaveSlotData>>;
/** Generated Node Admin SDK operation action function for the 'CreateSaveSlot' Mutation. Allow users to pass in custom DataConnect instances. */
export function createSaveSlot(vars: CreateSaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateSaveSlotData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertSaveSlot' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertSaveSlot(dc: DataConnect, vars: UpsertSaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertSaveSlotData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertSaveSlot' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertSaveSlot(vars: UpsertSaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertSaveSlotData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteSaveSlot' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteSaveSlot(dc: DataConnect, vars: DeleteSaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteSaveSlotData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteSaveSlot' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteSaveSlot(vars: DeleteSaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteSaveSlotData>>;

