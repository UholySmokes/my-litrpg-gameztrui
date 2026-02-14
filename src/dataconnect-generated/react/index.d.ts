import { ListMySaveSlotsData, GetMySaveSlotData, GetMySaveSlotVariables, ListMyRunSnapshotsData, ListMyRunSnapshotsVariables, UpsertMyProfileData, UpsertMyProfileVariables, CreateSaveSlotData, CreateSaveSlotVariables, UpsertSaveSlotData, UpsertSaveSlotVariables, DeleteSaveSlotData, DeleteSaveSlotVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListMySaveSlots(options?: useDataConnectQueryOptions<ListMySaveSlotsData>): UseDataConnectQueryResult<ListMySaveSlotsData, undefined>;
export function useListMySaveSlots(dc: DataConnect, options?: useDataConnectQueryOptions<ListMySaveSlotsData>): UseDataConnectQueryResult<ListMySaveSlotsData, undefined>;

export function useGetMySaveSlot(vars: GetMySaveSlotVariables, options?: useDataConnectQueryOptions<GetMySaveSlotData>): UseDataConnectQueryResult<GetMySaveSlotData, GetMySaveSlotVariables>;
export function useGetMySaveSlot(dc: DataConnect, vars: GetMySaveSlotVariables, options?: useDataConnectQueryOptions<GetMySaveSlotData>): UseDataConnectQueryResult<GetMySaveSlotData, GetMySaveSlotVariables>;

export function useListMyRunSnapshots(vars: ListMyRunSnapshotsVariables, options?: useDataConnectQueryOptions<ListMyRunSnapshotsData>): UseDataConnectQueryResult<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;
export function useListMyRunSnapshots(dc: DataConnect, vars: ListMyRunSnapshotsVariables, options?: useDataConnectQueryOptions<ListMyRunSnapshotsData>): UseDataConnectQueryResult<ListMyRunSnapshotsData, ListMyRunSnapshotsVariables>;

export function useUpsertMyProfile(options?: useDataConnectMutationOptions<UpsertMyProfileData, FirebaseError, UpsertMyProfileVariables>): UseDataConnectMutationResult<UpsertMyProfileData, UpsertMyProfileVariables>;
export function useUpsertMyProfile(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertMyProfileData, FirebaseError, UpsertMyProfileVariables>): UseDataConnectMutationResult<UpsertMyProfileData, UpsertMyProfileVariables>;

export function useCreateSaveSlot(options?: useDataConnectMutationOptions<CreateSaveSlotData, FirebaseError, CreateSaveSlotVariables>): UseDataConnectMutationResult<CreateSaveSlotData, CreateSaveSlotVariables>;
export function useCreateSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<CreateSaveSlotData, FirebaseError, CreateSaveSlotVariables>): UseDataConnectMutationResult<CreateSaveSlotData, CreateSaveSlotVariables>;

export function useUpsertSaveSlot(options?: useDataConnectMutationOptions<UpsertSaveSlotData, FirebaseError, UpsertSaveSlotVariables>): UseDataConnectMutationResult<UpsertSaveSlotData, UpsertSaveSlotVariables>;
export function useUpsertSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<UpsertSaveSlotData, FirebaseError, UpsertSaveSlotVariables>): UseDataConnectMutationResult<UpsertSaveSlotData, UpsertSaveSlotVariables>;

export function useDeleteSaveSlot(options?: useDataConnectMutationOptions<DeleteSaveSlotData, FirebaseError, DeleteSaveSlotVariables>): UseDataConnectMutationResult<DeleteSaveSlotData, DeleteSaveSlotVariables>;
export function useDeleteSaveSlot(dc: DataConnect, options?: useDataConnectMutationOptions<DeleteSaveSlotData, FirebaseError, DeleteSaveSlotVariables>): UseDataConnectMutationResult<DeleteSaveSlotData, DeleteSaveSlotVariables>;
