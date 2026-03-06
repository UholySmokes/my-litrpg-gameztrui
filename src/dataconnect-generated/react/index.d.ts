import { GetMyProfileData, ListMySaveSlotsData, GetMySaveSlotData, GetMySaveSlotVariables, ListMyRunSnapshotsData, ListMyRunSnapshotsVariables, GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables, GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables, ListMyRunEventsSinceData, ListMyRunEventsSinceVariables, ListMyStoryMemoriesData, ListMyStoryMemoriesVariables, UpsertMyProfileData, UpsertMyProfileVariables, MarkMyProfileMigrationData, MarkMyProfileMigrationVariables, CreateSaveSlotData, CreateSaveSlotVariables, UpsertSaveSlotData, UpsertSaveSlotVariables, DeleteSaveSlotData, DeleteSaveSlotVariables, UpsertRunSessionData, UpsertRunSessionVariables, CreateRunEventData, CreateRunEventVariables, UpsertStoryMemoryData, UpsertStoryMemoryVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useGetMyProfile(options?: useDataConnectQueryOptions<GetMyProfileData>): UseDataConnectQueryResult<GetMyProfileData, undefined>;
export function useGetMyProfile(dc: DataConnect, options?: useDataConnectQueryOptions<GetMyProfileData>): UseDataConnectQueryResult<GetMyProfileData, undefined>;

export function useListMySaveSlots(options?: useDataConnectQueryOptions<ListMySaveSlotsData>): UseDataConnectQueryResult<ListMySaveSlotsData, undefined>;
export function useListMySaveSlots(dc: DataConnect, options?: useDataConnectQueryOptions<ListMySaveSlotsData>): UseDataConnectQueryResult<ListMySaveSlotsData, undefined>;

export function useGetMySaveSlot(vars: GetMySaveSlotVariables, options?: useDataConnectQueryOptions<GetMySaveSlotData>): UseDataConnectQueryResult<GetMySaveSlotData, GetMySaveSlotVariables>;
export function useGetMySaveSlot(dc: DataConnect, vars: GetMySaveSlotVariables, options?: useDataConnectQueryOptions<GetMySaveSlotData>): UseDataConnectQueryResult<GetMySaveSlotData, GetMySaveSlotVariables>;

export function useListMyRunSnapshots(vars: ListMyRunSnapshotsVariables, options?: useDataConnectQueryOptions<ListMyRunSnapshotsData>): UseDataConnectQueryResult<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
export function useListMyRunSnapshots(dc: DataConnect, vars: ListMyRunSnapshotsVariables, options?: useDataConnectQueryOptions<ListMyRunSnapshotsData>): UseDataConnectQueryResult<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;

export function useGetMyRunSessionByRunId(vars: GetMyRunSessionByRunIdVariables, options?: useDataConnectQueryOptions<GetMyRunSessionByRunIdData>): UseDataConnectQueryResult<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;
export function useGetMyRunSessionByRunId(dc: DataConnect, vars: GetMyRunSessionByRunIdVariables, options?: useDataConnectQueryOptions<GetMyRunSessionByRunIdData>): UseDataConnectQueryResult<GetMyRunSessionByRunIdData, GetMyRunSessionByRunIdVariables>;

export function useGetMyRunEventByCommitId(vars: GetMyRunEventByCommitIdVariables, options?: useDataConnectQueryOptions<GetMyRunEventByCommitIdData>): UseDataConnectQueryResult<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;
export function useGetMyRunEventByCommitId(dc: DataConnect, vars: GetMyRunEventByCommitIdVariables, options?: useDataConnectQueryOptions<GetMyRunEventByCommitIdData>): UseDataConnectQueryResult<GetMyRunEventByCommitIdData, GetMyRunEventByCommitIdVariables>;

export function useListMyRunEventsSince(vars: ListMyRunEventsSinceVariables, options?: useDataConnectQueryOptions<ListMyRunEventsSinceData>): UseDataConnectQueryResult<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;
export function useListMyRunEventsSince(dc: DataConnect, vars: ListMyRunEventsSinceVariables, options?: useDataConnectQueryOptions<ListMyRunEventsSinceData>): UseDataConnectQueryResult<ListMyRunEventsSinceData, ListMyRunEventsSinceVariables>;

export function useListMyStoryMemories(vars: ListMyStoryMemoriesVariables, options?: useDataConnectQueryOptions<ListMyStoryMemoriesData>): UseDataConnectQueryResult<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;
export function useListMyStoryMemories(dc: DataConnect, vars: ListMyStoryMemoriesVariables, options?: useDataConnectQueryOptions<ListMyStoryMemoriesData>): UseDataConnectQueryResult<ListMyStoryMemoriesData, ListMyStoryMemoriesVariables>;

export function useUpsertMyProfile(options?: useDataConnectMutationOptions<UpsertMyProfileData, FirebaseError, UpsertMyProfileVariables | void>): UseDataConnectMutationResult<UpsertMyProfileData, UpsertMyProfileVariables>;
export function useUpsertMyProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertMyProfileData, FirebaseError, UpsertMyProfileVariables | void>): UseDataConnectMutationResult<UpsertMyProfileData, UpsertMyProfileVariables>;

export function useMarkMyProfileMigration(options?: useDataConnectMutationOptions<MarkMyProfileMigrationData, FirebaseError, MarkMyProfileMigrationVariables>): UseDataConnectMutationResult<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;
export function useMarkMyProfileMigration(dc: DataConnect, options?: useDataConnectMutationOptions<MarkMyProfileMigrationData, FirebaseError, MarkMyProfileMigrationVariables>): UseDataConnectMutationResult<MarkMyProfileMigrationData, MarkMyProfileMigrationVariables>;

export function useCreateSaveSlot(options?: useDataConnectMutationOptions<CreateSaveSlotData, FirebaseError, CreateSaveSlotVariables>): UseDataConnectMutationResult<CreateSaveSlotData, CreateSaveSlotVariables>;
export function useCreateSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSaveSlotData, FirebaseError, CreateSaveSlotVariables>): UseDataConnectMutationResult<CreateSaveSlotData, CreateSaveSlotVariables>;

export function useUpsertSaveSlot(options?: useDataConnectMutationOptions<UpsertSaveSlotData, FirebaseError, UpsertSaveSlotVariables>): UseDataConnectMutationResult<UpsertSaveSlotData, UpsertSaveSlotVariables>;
export function useUpsertSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertSaveSlotData, FirebaseError, UpsertSaveSlotVariables>): UseDataConnectMutationResult<UpsertSaveSlotData, UpsertSaveSlotVariables>;

export function useDeleteSaveSlot(options?: useDataConnectMutationOptions<DeleteSaveSlotData, FirebaseError, DeleteSaveSlotVariables>): UseDataConnectMutationResult<DeleteSaveSlotData, DeleteSaveSlotVariables>;
export function useDeleteSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSaveSlotData, FirebaseError, DeleteSaveSlotVariables>): UseDataConnectMutationResult<DeleteSaveSlotData, DeleteSaveSlotVariables>;

export function useUpsertRunSession(options?: useDataConnectMutationOptions<UpsertRunSessionData, FirebaseError, UpsertRunSessionVariables>): UseDataConnectMutationResult<UpsertRunSessionData, UpsertRunSessionVariables>;
export function useUpsertRunSession(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertRunSessionData, FirebaseError, UpsertRunSessionVariables>): UseDataConnectMutationResult<UpsertRunSessionData, UpsertRunSessionVariables>;

export function useCreateRunEvent(options?: useDataConnectMutationOptions<CreateRunEventData, FirebaseError, CreateRunEventVariables>): UseDataConnectMutationResult<CreateRunEventData, CreateRunEventVariables>;
export function useCreateRunEvent(dc: DataConnect, options?: useDataConnectMutationOptions<CreateRunEventData, FirebaseError, CreateRunEventVariables>): UseDataConnectMutationResult<CreateRunEventData, CreateRunEventVariables>;

export function useUpsertStoryMemory(options?: useDataConnectMutationOptions<UpsertStoryMemoryData, FirebaseError, UpsertStoryMemoryVariables>): UseDataConnectMutationResult<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
export function useUpsertStoryMemory(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertStoryMemoryData, FirebaseError, UpsertStoryMemoryVariables>): UseDataConnectMutationResult<UpsertStoryMemoryData, UpsertStoryMemoryVariables>;
