import styles from './CreationArchetypeSystemPanel.module.css';

export default function CreationArchetypeSystemPanel({
  systems,
  selectedSystem,
  onSystemSelect,
  onAction,
}) {
  const selectedId = selectedSystem?.id || selectedSystem;
  const selectedEntry =
    selectedSystem ||
    (systems || []).find((system) => system.id === selectedId) ||
    null;

  return (
      <div className={styles.container}>
      <div className={styles.header}>System</div>
      <div className={styles.subtitle}>
        Choose the core System that will shape the rest of creation.
      </div>
      <div className={styles.systemsList}>
        {(systems || []).map((system) => {
          const isSelected = system.id === selectedId;
          return (
            <button
              key={system.id}
              type="button"
              onClick={() => onAction?.(() => onSystemSelect(system.id))}
              className={`${styles.systemButton} ${isSelected ? styles.selected : ''}`}
            >
              <div className={styles.systemButtonHeader}>
                <span>{system.name}</span>
                <span className={styles.systemButtonCategory}>
                  {system.category}
                </span>
              </div>
              <div className={styles.systemButtonSummary}>
                {system.summary || system.description}
              </div>
            </button>
          );
        })}
        {(systems || []).length === 0 && (
          <div className={styles.noSystems}>No systems available.</div>
        )}
      </div>
      {selectedEntry && (
        <div className={styles.detailsPanel}>
          <div className={styles.detailsLabel}>CORE LOOP</div>
          <div className={styles.detailsContent}>
            {(selectedEntry.coreLoop || []).join(' ')}
          </div>
          <div className={styles.detailsLabel}>PROGRESSION</div>
          <div className={styles.detailsContent}>
            {(selectedEntry.progression || []).join(' ')}
          </div>
          {selectedEntry.characterCreation?.attributeBias?.primary?.length ? (
            <>
              <div className={styles.detailsLabel}>CREATION BIAS</div>
              <div className={styles.detailsContent}>
                Primary: {selectedEntry.characterCreation.attributeBias.primary.join(', ')}.{" "}
                Secondary: {(selectedEntry.characterCreation.attributeBias.secondary || []).join(', ') || 'none'}.
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
