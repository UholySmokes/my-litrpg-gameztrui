import { useCallback, useMemo, useState } from "react";

export function useGameUiWindowController() {
  const [showShop, setShowShop] = useState(false);
  const [showGacha, setShowGacha] = useState(false);
  const [showTitleSystem, setShowTitleSystem] = useState(false);
  const [showProfessions, setShowProfessions] = useState(false);
  const [showStatusOverlay, setShowStatusOverlay] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showReplayInspector, setShowReplayInspector] = useState(false);
  const [equipmentSelectSlot, setEquipmentSelectSlot] = useState(null);
  const [focusWindowRequest, setFocusWindowRequest] = useState(null);

  const requestWindowFocus = useCallback((id) => {
    setFocusWindowRequest({ id, nonce: Date.now() });
  }, []);

  const toggleWindow = useCallback(
    (id, isOpen, setOpen) => {
      if (isOpen) {
        requestWindowFocus(id);
        return;
      }
      setOpen(true);
      requestWindowFocus(id);
    },
    [requestWindowFocus],
  );

  const handleOpenEquipmentSlot = useCallback(
    (slotKey) => {
      if (!slotKey) return;
      setEquipmentSelectSlot(slotKey);
      requestWindowFocus("equipmentSelect");
    },
    [requestWindowFocus],
  );

  const handleCloseEquipmentSelect = useCallback(() => {
    setEquipmentSelectSlot(null);
  }, []);

  const handleCloseShop = useCallback(() => setShowShop(false), []);
  const handleCloseGacha = useCallback(() => setShowGacha(false), []);
  const handleCloseTitleSystem = useCallback(() => setShowTitleSystem(false), []);
  const handleCloseProfessions = useCallback(() => setShowProfessions(false), []);
  const handleCloseStatusOverlay = useCallback(() => setShowStatusOverlay(false), []);
  const handleCloseSaveLoad = useCallback(() => setShowSaveLoad(false), []);
  const handleCloseQuests = useCallback(() => setShowQuests(false), []);
  const handleCloseReplayInspector = useCallback(
    () => setShowReplayInspector(false),
    [],
  );

  const handleToggleQuests = useCallback(
    () => toggleWindow("quests", showQuests, setShowQuests),
    [showQuests, toggleWindow],
  );
  const handleToggleShop = useCallback(
    () => toggleWindow("shop", showShop, setShowShop),
    [showShop, toggleWindow],
  );
  const handleToggleGacha = useCallback(
    () => toggleWindow("gacha", showGacha, setShowGacha),
    [showGacha, toggleWindow],
  );
  const handleToggleCraft = useCallback(
    () => toggleWindow("craft", showProfessions, setShowProfessions),
    [showProfessions, toggleWindow],
  );
  const handleToggleStatus = useCallback(
    () => toggleWindow("status", showStatusOverlay, setShowStatusOverlay),
    [showStatusOverlay, toggleWindow],
  );
  const handleToggleTitles = useCallback(
    () => toggleWindow("titles", showTitleSystem, setShowTitleSystem),
    [showTitleSystem, toggleWindow],
  );
  const handleToggleSaveLoad = useCallback(
    () => toggleWindow("saveLoad", showSaveLoad, setShowSaveLoad),
    [showSaveLoad, toggleWindow],
  );
  const handleToggleReplayInspector = useCallback(
    () =>
      toggleWindow(
        "replayInspector",
        showReplayInspector,
        setShowReplayInspector,
      ),
    [showReplayInspector, toggleWindow],
  );

  const quickActionsProps = useMemo(
    () => ({
      onToggleCraft: handleToggleCraft,
      onToggleGacha: handleToggleGacha,
      onToggleQuests: handleToggleQuests,
      onToggleReplayInspector: handleToggleReplayInspector,
      onToggleSaveLoad: handleToggleSaveLoad,
      onToggleShop: handleToggleShop,
      onToggleStatus: handleToggleStatus,
      onToggleTitles: handleToggleTitles,
    }),
    [
      handleToggleCraft,
      handleToggleGacha,
      handleToggleQuests,
      handleToggleReplayInspector,
      handleToggleSaveLoad,
      handleToggleShop,
      handleToggleStatus,
      handleToggleTitles,
    ],
  );

  return {
    equipmentSelectSlot,
    focusWindowRequest,
    quickActionsProps,
    showGacha,
    showProfessions,
    showQuests,
    showReplayInspector,
    showSaveLoad,
    showShop,
    showStatusOverlay,
    showTitleSystem,
    handleCloseEquipmentSelect,
    handleCloseGacha,
    handleCloseProfessions,
    handleCloseQuests,
    handleCloseReplayInspector,
    handleCloseSaveLoad,
    handleCloseShop,
    handleCloseStatusOverlay,
    handleCloseTitleSystem,
    handleOpenEquipmentSlot,
    setShowSaveLoad,
  };
}
