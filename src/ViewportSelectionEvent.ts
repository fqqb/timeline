import { TimelineEvent } from './TimelineEvent';
import { TimeRange } from './TimeRange';

/**
 * Event generated when the selected range has changed.
 */
export interface ViewportSelectionEvent extends TimelineEvent {
    /**
     * Selected time range (if any).
     */
    selection?: TimeRange;
}
