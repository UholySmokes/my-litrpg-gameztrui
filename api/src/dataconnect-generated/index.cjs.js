const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'my-litrpg-gameztrui',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

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

const upsertMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMyProfile', inputVars);
}
upsertMyProfileRef.operationName = 'UpsertMyProfile';
exports.upsertMyProfileRef = upsertMyProfileRef;

exports.upsertMyProfile = function upsertMyProfile(dcOrVars, vars) {
  return executeMutation(upsertMyProfileRef(dcOrVars, vars));
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
