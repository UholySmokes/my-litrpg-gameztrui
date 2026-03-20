import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

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

interface UpsertMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: UpsertMyProfileVariables): MutationRef<UpsertMyProfileData, UpsertMyProfileVariables>;
  operationName: string;
}
export const upsertMyProfileRef: UpsertMyProfileRef;

export function upsertMyProfile(vars?: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;
export function upsertMyProfile(dc: DataConnect, vars?: UpsertMyProfileVariables): MutationPromise<UpsertMyProfileData, UpsertMyProfileVariables>;

interface MarkMyProfileMigrationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: MarkMyProfileMigrationVariables): MutationRef<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: MarkMyProfileMigrationVariables): MutationRef<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
  operationName: string;
}
export const markMyProfileMigrationRef: MarkMyProfileMigrationRef;

export function markMyProfileMigration(vars: MarkMyProfileMigrationVariables): MutationPromise<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
export function markMyProfileMigration(dc: DataConnect, vars: MarkMyProfileMigrationVariables): MutationPromise<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;

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

interface DeleteRunSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRunSessionVariables): MutationRef<DeleteRunSessionData, DeleteRunSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteRunSessionVariables): MutationRef<DeleteRunSessionData, DeleteRunSessionVariables>;
  operationName: string;
}
export const deleteRunSessionRef: DeleteRunSessionRef;

export function deleteRunSession(vars: DeleteRunSessionVariables): MutationPromise<DeleteRunSessionData, DeleteRunSessionVariables>;
export function deleteRunSession(dc: DataConnect, vars: DeleteRunSessionVariables): MutationPromise<DeleteRunSessionData, DeleteRunSessionVariables>;

interface DeleteRunEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeleteRunEventVariables): MutationRef<DeleteRunEventData, DeleteRunEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeleteRunEventVariables): MutationRef<DeleteRunEventData, DeleteRunEventVariables>;
  operationName: string;
}
export const deleteRunEventRef: DeleteRunEventRef;

export function deleteRunEvent(vars: DeleteRunEventVariables): MutationPromise<DeleteRunEventData, DeleteRunEventVariables>;
export function deleteRunEvent(dc: DataConnect, vars: DeleteRunEventVariables): MutationPromise<DeleteRunEventData, DeleteRunEventVariables>;

interface UpsertRunSessionRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertRunSessionVariables): MutationRef<UpsertRunSessionData, UpsertRunSessionVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertRunSessionVariables): MutationRef<UpsertRunSessionData, UpsertRunSessionVariables>;
  operationName: string;
}
export const upsertRunSessionRef: UpsertRunSessionRef;

export function upsertRunSession(vars: UpsertRunSessionVariables): MutationPromise<UpsertRunSessionData, UpsertRunSessionVariables>;
export function upsertRunSession(dc: DataConnect, vars: UpsertRunSessionVariables): MutationPromise<UpsertRunSessionData, UpsertRunSessionVariables>;

interface CreateRunEventRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateRunEventVariables): MutationRef<CreateRunEventData, CreateRunEventVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateRunEventVariables): MutationRef<CreateRunEventData, CreateRunEventVariables>;
  operationName: string;
}
export const createRunEventRef: CreateRunEventRef;

export function createRunEvent(vars: CreateRunEventVariables): MutationPromise<CreateRunEventData, CreateRunEventVariables>;
export function createRunEvent(dc: DataConnect, vars: CreateRunEventVariables): MutationPromise<CreateRunEventData, CreateRunEventVariables>;

interface UpsertStoryMemoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpsertStoryMemoryVariables): MutationRef<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpsertStoryMemoryVariables): MutationRef<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
  operationName: string;
}
export const upsertStoryMemoryRef: UpsertStoryMemoryRef;

export function upsertStoryMemory(vars: UpsertStoryMemoryVariables): MutationPromise<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
export function upsertStoryMemory(dc: DataConnect, vars: UpsertStoryMemoryVariables): MutationPromise<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;

interface GetMyProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
  operationName: string;
}
export const getMyProfileRef: GetMyProfileRef;

export function getMyProfile(): QueryPromise<GetMyProfileData, undefined>;
export function getMyProfile(dc: DataConnect): QueryPromise<GetMyProfileData, undefined>;

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

interface GetMyRunSessionByRunIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMyRunSessionByRunIdVariables): QueryRef<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetMyRunSessionByRunIdVariables): QueryRef<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
  operationName: string;
}
export const getMyRunSessionByRunIdRef: GetMyRunSessionByRunIdRef;

export function getMyRunSessionByRunId(vars: GetMyRunSessionByRunIdVariables): QueryPromise<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
export function getMyRunSessionByRunId(dc: DataConnect, vars: GetMyRunSessionByRunIdVariables): QueryPromise<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;

interface GetMyRunEventByCommitIdRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetMyRunEventByCommitIdVariables): QueryRef<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetMyRunEventByCommitIdVariables): QueryRef<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
  operationName: string;
}
export const getMyRunEventByCommitIdRef: GetMyRunEventByCommitIdRef;

export function getMyRunEventByCommitId(vars: GetMyRunEventByCommitIdVariables): QueryPromise<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
export function getMyRunEventByCommitId(dc: DataConnect, vars: GetMyRunEventByCommitIdVariables): QueryPromise<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;

interface ListMyRunEventsSinceRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyRunEventsSinceVariables): QueryRef<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListMyRunEventsSinceVariables): QueryRef<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
  operationName: string;
}
export const listMyRunEventsSinceRef: ListMyRunEventsSinceRef;

export function listMyRunEventsSince(vars: ListMyRunEventsSinceVariables): QueryPromise<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
export function listMyRunEventsSince(dc: DataConnect, vars: ListMyRunEventsSinceVariables): QueryPromise<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;

interface ListAllMyRunSessionsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllMyRunSessionsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllMyRunSessionsData, undefined>;
  operationName: string;
}
export const listAllMyRunSessionsRef: ListAllMyRunSessionsRef;

export function listAllMyRunSessions(): QueryPromise<ListAllMyRunSessionsData, undefined>;
export function listAllMyRunSessions(dc: DataConnect): QueryPromise<ListAllMyRunSessionsData, undefined>;

interface ListAllMyRunEventsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListAllMyRunEventsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListAllMyRunEventsData, undefined>;
  operationName: string;
}
export const listAllMyRunEventsRef: ListAllMyRunEventsRef;

export function listAllMyRunEvents(): QueryPromise<ListAllMyRunEventsData, undefined>;
export function listAllMyRunEvents(dc: DataConnect): QueryPromise<ListAllMyRunEventsData, undefined>;

interface ListMyStoryMemoriesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListMyStoryMemoriesVariables): QueryRef<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListMyStoryMemoriesVariables): QueryRef<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
  operationName: string;
}
export const listMyStoryMemoriesRef: ListMyStoryMemoriesRef;

export function listMyStoryMemories(vars: ListMyStoryMemoriesVariables): QueryPromise<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
export function listMyStoryMemories(dc: DataConnect, vars: ListMyStoryMemoriesVariables): QueryPromise<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;

