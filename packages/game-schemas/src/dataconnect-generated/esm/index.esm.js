import { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

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

export function getMyProfile(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyProfileRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listMySaveSlotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMySaveSlots', inputVars);
}
listMySaveSlotsRef.operationName = 'ListMySaveSlots';

export function listMySaveSlots(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMySaveSlotsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getMySaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMySaveSlot', inputVars);
}
getMySaveSlotRef.operationName = 'GetMySaveSlot';

export function getMySaveSlot(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getMySaveSlotRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listMyRunSnapshotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunSnapshots', inputVars);
}
listMyRunSnapshotsRef.operationName = 'ListMyRunSnapshots';

export function listMyRunSnapshots(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyRunSnapshotsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getMyRunSessionByRunIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunSessionByRunId', inputVars);
}
getMyRunSessionByRunIdRef.operationName = 'GetMyRunSessionByRunId';

export function getMyRunSessionByRunId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getMyRunSessionByRunIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const getMyRunEventByCommitIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunEventByCommitId', inputVars);
}
getMyRunEventByCommitIdRef.operationName = 'GetMyRunEventByCommitId';

export function getMyRunEventByCommitId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getMyRunEventByCommitIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listMyRunEventsSinceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunEventsSince', inputVars);
}
listMyRunEventsSinceRef.operationName = 'ListMyRunEventsSince';

export function listMyRunEventsSince(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyRunEventsSinceRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listAllMyRunSessionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllMyRunSessions');
}
listAllMyRunSessionsRef.operationName = 'ListAllMyRunSessions';

export function listAllMyRunSessions(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllMyRunSessionsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listAllMyRunEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllMyRunEvents');
}
listAllMyRunEventsRef.operationName = 'ListAllMyRunEvents';

export function listAllMyRunEvents(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllMyRunEventsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const listMyStoryMemoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyStoryMemories', inputVars);
}
listMyStoryMemoriesRef.operationName = 'ListMyStoryMemories';

export function listMyStoryMemories(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyStoryMemoriesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}

export const upsertMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMyProfile', inputVars);
}
upsertMyProfileRef.operationName = 'UpsertMyProfile';

export function upsertMyProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars);
  return executeMutation(upsertMyProfileRef(dcInstance, inputVars));
}

export const markMyProfileMigrationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkMyProfileMigration', inputVars);
}
markMyProfileMigrationRef.operationName = 'MarkMyProfileMigration';

export function markMyProfileMigration(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(markMyProfileMigrationRef(dcInstance, inputVars));
}

export const createSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSaveSlot', inputVars);
}
createSaveSlotRef.operationName = 'CreateSaveSlot';

export function createSaveSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSaveSlotRef(dcInstance, inputVars));
}

export const upsertSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSaveSlot', inputVars);
}
upsertSaveSlotRef.operationName = 'UpsertSaveSlot';

export function upsertSaveSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertSaveSlotRef(dcInstance, inputVars));
}

export const deleteSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteSaveSlot', inputVars);
}
deleteSaveSlotRef.operationName = 'DeleteSaveSlot';

export function deleteSaveSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteSaveSlotRef(dcInstance, inputVars));
}

export const deleteRunSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteRunSession', inputVars);
}
deleteRunSessionRef.operationName = 'DeleteRunSession';

export function deleteRunSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteRunSessionRef(dcInstance, inputVars));
}

export const deleteRunEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteRunEvent', inputVars);
}
deleteRunEventRef.operationName = 'DeleteRunEvent';

export function deleteRunEvent(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteRunEventRef(dcInstance, inputVars));
}

export const upsertRunSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertRunSession', inputVars);
}
upsertRunSessionRef.operationName = 'UpsertRunSession';

export function upsertRunSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertRunSessionRef(dcInstance, inputVars));
}

export const createRunEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateRunEvent', inputVars);
}
createRunEventRef.operationName = 'CreateRunEvent';

export function createRunEvent(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createRunEventRef(dcInstance, inputVars));
}

export const upsertStoryMemoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertStoryMemory', inputVars);
}
upsertStoryMemoryRef.operationName = 'UpsertStoryMemory';

export function upsertStoryMemory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertStoryMemoryRef(dcInstance, inputVars));
}

