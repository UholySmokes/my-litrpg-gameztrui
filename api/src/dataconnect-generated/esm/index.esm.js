import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'my-litrpg-gameztrui',
  location: 'us-east4'
};

export const getMyProfileRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyProfile');
}
getMyProfileRef.operationName = 'GetMyProfile';

export function getMyProfile(dc) {
  return executeQuery(getMyProfileRef(dc));
}

export const listMySaveSlotsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMySaveSlots');
}
listMySaveSlotsRef.operationName = 'ListMySaveSlots';

export function listMySaveSlots(dc) {
  return executeQuery(listMySaveSlotsRef(dc));
}

export const getMySaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMySaveSlot', inputVars);
}
getMySaveSlotRef.operationName = 'GetMySaveSlot';

export function getMySaveSlot(dcOrVars, vars) {
  return executeQuery(getMySaveSlotRef(dcOrVars, vars));
}

export const listMyRunSnapshotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunSnapshots', inputVars);
}
listMyRunSnapshotsRef.operationName = 'ListMyRunSnapshots';

export function listMyRunSnapshots(dcOrVars, vars) {
  return executeQuery(listMyRunSnapshotsRef(dcOrVars, vars));
}

export const getMyRunSessionByRunIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunSessionByRunId', inputVars);
}
getMyRunSessionByRunIdRef.operationName = 'GetMyRunSessionByRunId';

export function getMyRunSessionByRunId(dcOrVars, vars) {
  return executeQuery(getMyRunSessionByRunIdRef(dcOrVars, vars));
}

export const getMyRunEventByCommitIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunEventByCommitId', inputVars);
}
getMyRunEventByCommitIdRef.operationName = 'GetMyRunEventByCommitId';

export function getMyRunEventByCommitId(dcOrVars, vars) {
  return executeQuery(getMyRunEventByCommitIdRef(dcOrVars, vars));
}

export const listMyRunEventsSinceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunEventsSince', inputVars);
}
listMyRunEventsSinceRef.operationName = 'ListMyRunEventsSince';

export function listMyRunEventsSince(dcOrVars, vars) {
  return executeQuery(listMyRunEventsSinceRef(dcOrVars, vars));
}

export const listMyStoryMemoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyStoryMemories', inputVars);
}
listMyStoryMemoriesRef.operationName = 'ListMyStoryMemories';

export function listMyStoryMemories(dcOrVars, vars) {
  return executeQuery(listMyStoryMemoriesRef(dcOrVars, vars));
}

export const upsertMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMyProfile', inputVars);
}
upsertMyProfileRef.operationName = 'UpsertMyProfile';

export function upsertMyProfile(dcOrVars, vars) {
  return executeMutation(upsertMyProfileRef(dcOrVars, vars));
}

export const markMyProfileMigrationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkMyProfileMigration', inputVars);
}
markMyProfileMigrationRef.operationName = 'MarkMyProfileMigration';

export function markMyProfileMigration(dcOrVars, vars) {
  return executeMutation(markMyProfileMigrationRef(dcOrVars, vars));
}

export const createSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSaveSlot', inputVars);
}
createSaveSlotRef.operationName = 'CreateSaveSlot';

export function createSaveSlot(dcOrVars, vars) {
  return executeMutation(createSaveSlotRef(dcOrVars, vars));
}

export const upsertSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSaveSlot', inputVars);
}
upsertSaveSlotRef.operationName = 'UpsertSaveSlot';

export function upsertSaveSlot(dcOrVars, vars) {
  return executeMutation(upsertSaveSlotRef(dcOrVars, vars));
}

export const deleteSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteSaveSlot', inputVars);
}
deleteSaveSlotRef.operationName = 'DeleteSaveSlot';

export function deleteSaveSlot(dcOrVars, vars) {
  return executeMutation(deleteSaveSlotRef(dcOrVars, vars));
}

export const upsertRunSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertRunSession', inputVars);
}
upsertRunSessionRef.operationName = 'UpsertRunSession';

export function upsertRunSession(dcOrVars, vars) {
  return executeMutation(upsertRunSessionRef(dcOrVars, vars));
}

export const createRunEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateRunEvent', inputVars);
}
createRunEventRef.operationName = 'CreateRunEvent';

export function createRunEvent(dcOrVars, vars) {
  return executeMutation(createRunEventRef(dcOrVars, vars));
}

export const upsertStoryMemoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertStoryMemory', inputVars);
}
upsertStoryMemoryRef.operationName = 'UpsertStoryMemory';

export function upsertStoryMemory(dcOrVars, vars) {
  return executeMutation(upsertStoryMemoryRef(dcOrVars, vars));
}

