
/**
 * Value-specific properties.
 *
 * Style attributes are optional. Values that are defined
 * here are prioritized over band attributes.
 */
export interface StateChange {

    /**
     * Start time
     */
    time: number;

    /**
     * State value, or null if the previous state is no longer valid.
     */
    state: string | null;
}
