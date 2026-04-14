const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'my-litrpg-gameztrui',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const getMyProfileRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyProfile');
}
getMyProfileRef.operationName = 'GetMyProfile';
exports.getMyProfileRef = getMyProfileRef;

exports.getMyProfile = function getMyProfile(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyProfileRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listMySaveSlotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMySaveSlots', inputVars);
}
listMySaveSlotsRef.operationName = 'ListMySaveSlots';
exports.listMySaveSlotsRef = listMySaveSlotsRef;

exports.listMySaveSlots = function listMySaveSlots(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMySaveSlotsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getMySaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMySaveSlot', inputVars);
}
getMySaveSlotRef.operationName = 'GetMySaveSlot';
exports.getMySaveSlotRef = getMySaveSlotRef;

exports.getMySaveSlot = function getMySaveSlot(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getMySaveSlotRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listMyRunSnapshotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunSnapshots', inputVars);
}
listMyRunSnapshotsRef.operationName = 'ListMyRunSnapshots';
exports.listMyRunSnapshotsRef = listMyRunSnapshotsRef;

exports.listMyRunSnapshots = function listMyRunSnapshots(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyRunSnapshotsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getMyRunSessionByRunIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunSessionByRunId', inputVars);
}
getMyRunSessionByRunIdRef.operationName = 'GetMyRunSessionByRunId';
exports.getMyRunSessionByRunIdRef = getMyRunSessionByRunIdRef;

exports.getMyRunSessionByRunId = function getMyRunSessionByRunId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getMyRunSessionByRunIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const getMyRunEventByCommitIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunEventByCommitId', inputVars);
}
getMyRunEventByCommitIdRef.operationName = 'GetMyRunEventByCommitId';
exports.getMyRunEventByCommitIdRef = getMyRunEventByCommitIdRef;

exports.getMyRunEventByCommitId = function getMyRunEventByCommitId(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(getMyRunEventByCommitIdRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listMyRunEventsSinceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunEventsSince', inputVars);
}
listMyRunEventsSinceRef.operationName = 'ListMyRunEventsSince';
exports.listMyRunEventsSinceRef = listMyRunEventsSinceRef;

exports.listMyRunEventsSince = function listMyRunEventsSince(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyRunEventsSinceRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listAllMyRunSessionsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllMyRunSessions');
}
listAllMyRunSessionsRef.operationName = 'ListAllMyRunSessions';
exports.listAllMyRunSessionsRef = listAllMyRunSessionsRef;

exports.listAllMyRunSessions = function listAllMyRunSessions(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllMyRunSessionsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listAllMyRunEventsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListAllMyRunEvents');
}
listAllMyRunEventsRef.operationName = 'ListAllMyRunEvents';
exports.listAllMyRunEventsRef = listAllMyRunEventsRef;

exports.listAllMyRunEvents = function listAllMyRunEvents(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listAllMyRunEventsRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const listMyStoryMemoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyStoryMemories', inputVars);
}
listMyStoryMemoriesRef.operationName = 'ListMyStoryMemories';
exports.listMyStoryMemoriesRef = listMyStoryMemoriesRef;

exports.listMyStoryMemories = function listMyStoryMemories(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listMyStoryMemoriesRef(dcInstance, inputVars), inputOpts && inputOpts.fetchPolicy);
}
;

const upsertMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMyProfile', inputVars);
}
upsertMyProfileRef.operationName = 'UpsertMyProfile';
exports.upsertMyProfileRef = upsertMyProfileRef;

exports.upsertMyProfile = function upsertMyProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars);
  return executeMutation(upsertMyProfileRef(dcInstance, inputVars));
}
;

const markMyProfileMigrationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkMyProfileMigration', inputVars);
}
markMyProfileMigrationRef.operationName = 'MarkMyProfileMigration';
exports.markMyProfileMigrationRef = markMyProfileMigrationRef;

exports.markMyProfileMigration = function markMyProfileMigration(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(markMyProfileMigrationRef(dcInstance, inputVars));
}
;

const createSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSaveSlot', inputVars);
}
createSaveSlotRef.operationName = 'CreateSaveSlot';
exports.createSaveSlotRef = createSaveSlotRef;

exports.createSaveSlot = function createSaveSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createSaveSlotRef(dcInstance, inputVars));
}
;

const upsertSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSaveSlot', inputVars);
}
upsertSaveSlotRef.operationName = 'UpsertSaveSlot';
exports.upsertSaveSlotRef = upsertSaveSlotRef;

exports.upsertSaveSlot = function upsertSaveSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertSaveSlotRef(dcInstance, inputVars));
}
;

const deleteSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteSaveSlot', inputVars);
}
deleteSaveSlotRef.operationName = 'DeleteSaveSlot';
exports.deleteSaveSlotRef = deleteSaveSlotRef;

exports.deleteSaveSlot = function deleteSaveSlot(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteSaveSlotRef(dcInstance, inputVars));
}
;

const deleteRunSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteRunSession', inputVars);
}
deleteRunSessionRef.operationName = 'DeleteRunSession';
exports.deleteRunSessionRef = deleteRunSessionRef;

exports.deleteRunSession = function deleteRunSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteRunSessionRef(dcInstance, inputVars));
}
;

const deleteRunEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteRunEvent', inputVars);
}
deleteRunEventRef.operationName = 'DeleteRunEvent';
exports.deleteRunEventRef = deleteRunEventRef;

exports.deleteRunEvent = function deleteRunEvent(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deleteRunEventRef(dcInstance, inputVars));
}
;

const upsertRunSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertRunSession', inputVars);
}
upsertRunSessionRef.operationName = 'UpsertRunSession';
exports.upsertRunSessionRef = upsertRunSessionRef;

exports.upsertRunSession = function upsertRunSession(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertRunSessionRef(dcInstance, inputVars));
}
;

const createRunEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateRunEvent', inputVars);
}
createRunEventRef.operationName = 'CreateRunEvent';
exports.createRunEventRef = createRunEventRef;

exports.createRunEvent = function createRunEvent(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createRunEventRef(dcInstance, inputVars));
}
;

const upsertStoryMemoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertStoryMemory', inputVars);
}
upsertStoryMemoryRef.operationName = 'UpsertStoryMemory';
exports.upsertStoryMemoryRef = upsertStoryMemoryRef;

exports.upsertStoryMemory = function upsertStoryMemory(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertStoryMemoryRef(dcInstance, inputVars));
}
;
