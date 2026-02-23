const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'my-litrpg-gameztrui',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const upsertMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMyProfile', inputVars);
}
upsertMyProfileRef.operationName = 'UpsertMyProfile';
exports.upsertMyProfileRef = upsertMyProfileRef;

exports.upsertMyProfile = function upsertMyProfile(dcOrVars, vars) {
  return executeMutation(upsertMyProfileRef(dcOrVars, vars));
};

const markMyProfileMigrationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'MarkMyProfileMigration', inputVars);
}
markMyProfileMigrationRef.operationName = 'MarkMyProfileMigration';
exports.markMyProfileMigrationRef = markMyProfileMigrationRef;

exports.markMyProfileMigration = function markMyProfileMigration(dcOrVars, vars) {
  return executeMutation(markMyProfileMigrationRef(dcOrVars, vars));
};

const createSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateSaveSlot', inputVars);
}
createSaveSlotRef.operationName = 'CreateSaveSlot';
exports.createSaveSlotRef = createSaveSlotRef;

exports.createSaveSlot = function createSaveSlot(dcOrVars, vars) {
  return executeMutation(createSaveSlotRef(dcOrVars, vars));
};

const upsertSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertSaveSlot', inputVars);
}
upsertSaveSlotRef.operationName = 'UpsertSaveSlot';
exports.upsertSaveSlotRef = upsertSaveSlotRef;

exports.upsertSaveSlot = function upsertSaveSlot(dcOrVars, vars) {
  return executeMutation(upsertSaveSlotRef(dcOrVars, vars));
};

const deleteSaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeleteSaveSlot', inputVars);
}
deleteSaveSlotRef.operationName = 'DeleteSaveSlot';
exports.deleteSaveSlotRef = deleteSaveSlotRef;

exports.deleteSaveSlot = function deleteSaveSlot(dcOrVars, vars) {
  return executeMutation(deleteSaveSlotRef(dcOrVars, vars));
};

const upsertRunSessionRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertRunSession', inputVars);
}
upsertRunSessionRef.operationName = 'UpsertRunSession';
exports.upsertRunSessionRef = upsertRunSessionRef;

exports.upsertRunSession = function upsertRunSession(dcOrVars, vars) {
  return executeMutation(upsertRunSessionRef(dcOrVars, vars));
};

const createRunEventRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateRunEvent', inputVars);
}
createRunEventRef.operationName = 'CreateRunEvent';
exports.createRunEventRef = createRunEventRef;

exports.createRunEvent = function createRunEvent(dcOrVars, vars) {
  return executeMutation(createRunEventRef(dcOrVars, vars));
};

const upsertStoryMemoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertStoryMemory', inputVars);
}
upsertStoryMemoryRef.operationName = 'UpsertStoryMemory';
exports.upsertStoryMemoryRef = upsertStoryMemoryRef;

exports.upsertStoryMemory = function upsertStoryMemory(dcOrVars, vars) {
  return executeMutation(upsertStoryMemoryRef(dcOrVars, vars));
};

const getMyProfileRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyProfile');
}
getMyProfileRef.operationName = 'GetMyProfile';
exports.getMyProfileRef = getMyProfileRef;

exports.getMyProfile = function getMyProfile(dc) {
  return executeQuery(getMyProfileRef(dc));
};

const listMySaveSlotsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMySaveSlots');
}
listMySaveSlotsRef.operationName = 'ListMySaveSlots';
exports.listMySaveSlotsRef = listMySaveSlotsRef;

exports.listMySaveSlots = function listMySaveSlots(dc) {
  return executeQuery(listMySaveSlotsRef(dc));
};

const getMySaveSlotRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMySaveSlot', inputVars);
}
getMySaveSlotRef.operationName = 'GetMySaveSlot';
exports.getMySaveSlotRef = getMySaveSlotRef;

exports.getMySaveSlot = function getMySaveSlot(dcOrVars, vars) {
  return executeQuery(getMySaveSlotRef(dcOrVars, vars));
};

const listMyRunSnapshotsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunSnapshots', inputVars);
}
listMyRunSnapshotsRef.operationName = 'ListMyRunSnapshots';
exports.listMyRunSnapshotsRef = listMyRunSnapshotsRef;

exports.listMyRunSnapshots = function listMyRunSnapshots(dcOrVars, vars) {
  return executeQuery(listMyRunSnapshotsRef(dcOrVars, vars));
};

const getMyRunSessionByRunIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunSessionByRunId', inputVars);
}
getMyRunSessionByRunIdRef.operationName = 'GetMyRunSessionByRunId';
exports.getMyRunSessionByRunIdRef = getMyRunSessionByRunIdRef;

exports.getMyRunSessionByRunId = function getMyRunSessionByRunId(dcOrVars, vars) {
  return executeQuery(getMyRunSessionByRunIdRef(dcOrVars, vars));
};

const getMyRunEventByCommitIdRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyRunEventByCommitId', inputVars);
}
getMyRunEventByCommitIdRef.operationName = 'GetMyRunEventByCommitId';
exports.getMyRunEventByCommitIdRef = getMyRunEventByCommitIdRef;

exports.getMyRunEventByCommitId = function getMyRunEventByCommitId(dcOrVars, vars) {
  return executeQuery(getMyRunEventByCommitIdRef(dcOrVars, vars));
};

const listMyRunEventsSinceRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRunEventsSince', inputVars);
}
listMyRunEventsSinceRef.operationName = 'ListMyRunEventsSince';
exports.listMyRunEventsSinceRef = listMyRunEventsSinceRef;

exports.listMyRunEventsSince = function listMyRunEventsSince(dcOrVars, vars) {
  return executeQuery(listMyRunEventsSinceRef(dcOrVars, vars));
};

const listMyStoryMemoriesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyStoryMemories', inputVars);
}
listMyStoryMemoriesRef.operationName = 'ListMyStoryMemories';
exports.listMyStoryMemoriesRef = listMyStoryMemoriesRef;

exports.listMyStoryMemories = function listMyStoryMemories(dcOrVars, vars) {
  return executeQuery(listMyStoryMemoriesRef(dcOrVars, vars));
};
