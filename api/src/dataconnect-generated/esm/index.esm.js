import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'my-litrpg-gameztrui',
  location: 'us-east4'
};

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

export const upsertMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMyProfile', inputVars);
}
upsertMyProfileRef.operationName = 'UpsertMyProfile';

export function upsertMyProfile(dcOrVars, vars) {
  return executeMutation(upsertMyProfileRef(dcOrVars, vars));
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

