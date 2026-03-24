import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface CreateRunEventData {
  runEvent_insert: RunEvent_Key;
}

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

export interface DeleteRunEventData {
  runEvent_delete?: RunEvent_Key | null;
}

export interface DeleteRunEventVariables {
  id: UUIDString;
}

export interface DeleteRunSessionData {
  runSession_delete?: RunSession_Key | null;
}

export interface DeleteRunSessionVariables {
  id: UUIDString;
}

export interface DeleteSaveSlotData {
  saveSlot_delete?: SaveSlot_Key | null;
}

export interface DeleteSaveSlotVariables {
  id: UUIDString;
}

export interface DiscoveryListItem_Key {
  discoveryListId: UUIDString;
  gameEntityId: UUIDString;
  __typename?: 'DiscoveryListItem_Key';
}

export interface DiscoveryList_Key {
  id: UUIDString;
  __typename?: 'DiscoveryList_Key';
}

export interface GameEntity_Key {
  id: UUIDString;
  __typename?: 'GameEntity_Key';
}

export interface GameSession_Key {
  id: UUIDString;
  __typename?: 'GameSession_Key';
}

export interface GetMyProfileData {
  userProfile?: {
    id: string;
    displayName?: string | null;
    migrationVersion?: number | null;
    createdAt: DateString;
    updatedAt: DateString;
  } & UserProfile_Key;
}

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

export interface GetMyRunEventByCommitIdVariables {
  runId: string;
  commitId: string;
}

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

export interface GetMyRunSessionByRunIdVariables {
  runId: string;
}

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

export interface GetMySaveSlotVariables {
  id: UUIDString;
}

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

export interface ListMyRunEventsSinceVariables {
  runId: string;
  afterSeq: number;
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
    } & SaveSlot_Key)[];
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

export interface ListMySaveSlotsVariables {
  limit: number;
}

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

export interface ListMyStoryMemoriesVariables {
  runId: string;
}

export interface MarkMyProfileMigrationData {
  userProfile_upsert: UserProfile_Key;
}

export interface MarkMyProfileMigrationVariables {
  migrationVersion: number;
  displayName?: string | null;
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface RunEvent_Key {
  id: UUIDString;
  __typename?: 'RunEvent_Key';
}

export interface RunSession_Key {
  id: UUIDString;
  __typename?: 'RunSession_Key';
}

export interface SaveSlot_Key {
  id: UUIDString;
  __typename?: 'SaveSlot_Key';
}

export interface StoryMemory_Key {
  id: UUIDString;
  __typename?: 'StoryMemory_Key';
}

export interface UpsertMyProfileData {
  userProfile_upsert: UserProfile_Key;
}

export interface UpsertMyProfileVariables {
  displayName?: string | null;
}

export interface UpsertRunSessionData {
  runSession_upsert: RunSession_Key;
}

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

export interface UpsertStoryMemoryData {
  storyMemory_upsert: StoryMemory_Key;
}

export interface UpsertStoryMemoryVariables {
  id: UUIDString;
  runId: string;
  memoryKey: string;
  memoryJson: string;
  lastSeq?: number | null;
}

export interface UserProfile_Key {
  id: string;
  __typename?: 'UserProfile_Key';
}

/** Generated Node Admin SDK operation action function for the 'UpsertMyProfile' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertMyProfile(dc: DataConnect, vars?: UpsertMyProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertMyProfileData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertMyProfile' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertMyProfile(vars?: UpsertMyProfileVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertMyProfileData>>;

/** Generated Node Admin SDK operation action function for the 'MarkMyProfileMigration' Mutation. Allow users to execute without passing in DataConnect. */
export function markMyProfileMigration(dc: DataConnect, vars: MarkMyProfileMigrationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkMyProfileMigrationData>>;
/** Generated Node Admin SDK operation action function for the 'MarkMyProfileMigration' Mutation. Allow users to pass in custom DataConnect instances. */
export function markMyProfileMigration(vars: MarkMyProfileMigrationVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<MarkMyProfileMigrationData>>;

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

/** Generated Node Admin SDK operation action function for the 'DeleteRunSession' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteRunSession(dc: DataConnect, vars: DeleteRunSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteRunSessionData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteRunSession' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteRunSession(vars: DeleteRunSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteRunSessionData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteRunEvent' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteRunEvent(dc: DataConnect, vars: DeleteRunEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteRunEventData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteRunEvent' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteRunEvent(vars: DeleteRunEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteRunEventData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertRunSession' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertRunSession(dc: DataConnect, vars: UpsertRunSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertRunSessionData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertRunSession' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertRunSession(vars: UpsertRunSessionVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertRunSessionData>>;

/** Generated Node Admin SDK operation action function for the 'CreateRunEvent' Mutation. Allow users to execute without passing in DataConnect. */
export function createRunEvent(dc: DataConnect, vars: CreateRunEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateRunEventData>>;
/** Generated Node Admin SDK operation action function for the 'CreateRunEvent' Mutation. Allow users to pass in custom DataConnect instances. */
export function createRunEvent(vars: CreateRunEventVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateRunEventData>>;

/** Generated Node Admin SDK operation action function for the 'UpsertStoryMemory' Mutation. Allow users to execute without passing in DataConnect. */
export function upsertStoryMemory(dc: DataConnect, vars: UpsertStoryMemoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertStoryMemoryData>>;
/** Generated Node Admin SDK operation action function for the 'UpsertStoryMemory' Mutation. Allow users to pass in custom DataConnect instances. */
export function upsertStoryMemory(vars: UpsertStoryMemoryVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpsertStoryMemoryData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyProfile' Query. Allow users to execute without passing in DataConnect. */
export function getMyProfile(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyProfileData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyProfile' Query. Allow users to pass in custom DataConnect instances. */
export function getMyProfile(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyProfileData>>;

/** Generated Node Admin SDK operation action function for the 'ListMySaveSlots' Query. Allow users to execute without passing in DataConnect. */
export function listMySaveSlots(dc: DataConnect, vars: ListMySaveSlotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMySaveSlotsData>>;
/** Generated Node Admin SDK operation action function for the 'ListMySaveSlots' Query. Allow users to pass in custom DataConnect instances. */
export function listMySaveSlots(vars: ListMySaveSlotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMySaveSlotsData>>;

/** Generated Node Admin SDK operation action function for the 'GetMySaveSlot' Query. Allow users to execute without passing in DataConnect. */
export function getMySaveSlot(dc: DataConnect, vars: GetMySaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMySaveSlotData>>;
/** Generated Node Admin SDK operation action function for the 'GetMySaveSlot' Query. Allow users to pass in custom DataConnect instances. */
export function getMySaveSlot(vars: GetMySaveSlotVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMySaveSlotData>>;

/** Generated Node Admin SDK operation action function for the 'ListMyRunSnapshots' Query. Allow users to execute without passing in DataConnect. */
export function listMyRunSnapshots(dc: DataConnect, vars: ListMyRunSnapshotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyRunSnapshotsData>>;
/** Generated Node Admin SDK operation action function for the 'ListMyRunSnapshots' Query. Allow users to pass in custom DataConnect instances. */
export function listMyRunSnapshots(vars: ListMyRunSnapshotsVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyRunSnapshotsData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyRunSessionByRunId' Query. Allow users to execute without passing in DataConnect. */
export function getMyRunSessionByRunId(dc: DataConnect, vars: GetMyRunSessionByRunIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyRunSessionByRunIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyRunSessionByRunId' Query. Allow users to pass in custom DataConnect instances. */
export function getMyRunSessionByRunId(vars: GetMyRunSessionByRunIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyRunSessionByRunIdData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyRunEventByCommitId' Query. Allow users to execute without passing in DataConnect. */
export function getMyRunEventByCommitId(dc: DataConnect, vars: GetMyRunEventByCommitIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyRunEventByCommitIdData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyRunEventByCommitId' Query. Allow users to pass in custom DataConnect instances. */
export function getMyRunEventByCommitId(vars: GetMyRunEventByCommitIdVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyRunEventByCommitIdData>>;

/** Generated Node Admin SDK operation action function for the 'ListMyRunEventsSince' Query. Allow users to execute without passing in DataConnect. */
export function listMyRunEventsSince(dc: DataConnect, vars: ListMyRunEventsSinceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyRunEventsSinceData>>;
/** Generated Node Admin SDK operation action function for the 'ListMyRunEventsSince' Query. Allow users to pass in custom DataConnect instances. */
export function listMyRunEventsSince(vars: ListMyRunEventsSinceVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyRunEventsSinceData>>;

/** Generated Node Admin SDK operation action function for the 'ListAllMyRunSessions' Query. Allow users to execute without passing in DataConnect. */
export function listAllMyRunSessions(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllMyRunSessionsData>>;
/** Generated Node Admin SDK operation action function for the 'ListAllMyRunSessions' Query. Allow users to pass in custom DataConnect instances. */
export function listAllMyRunSessions(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllMyRunSessionsData>>;

/** Generated Node Admin SDK operation action function for the 'ListAllMyRunEvents' Query. Allow users to execute without passing in DataConnect. */
export function listAllMyRunEvents(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllMyRunEventsData>>;
/** Generated Node Admin SDK operation action function for the 'ListAllMyRunEvents' Query. Allow users to pass in custom DataConnect instances. */
export function listAllMyRunEvents(options?: OperationOptions): Promise<ExecuteOperationResponse<ListAllMyRunEventsData>>;

/** Generated Node Admin SDK operation action function for the 'ListMyStoryMemories' Query. Allow users to execute without passing in DataConnect. */
export function listMyStoryMemories(dc: DataConnect, vars: ListMyStoryMemoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyStoryMemoriesData>>;
/** Generated Node Admin SDK operation action function for the 'ListMyStoryMemories' Query. Allow users to pass in custom DataConnect instances. */
export function listMyStoryMemories(vars: ListMyStoryMemoriesVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ListMyStoryMemoriesData>>;

