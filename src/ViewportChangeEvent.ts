import { TimelineEvent } from './TimelineEvent';

/**
 * Event generated when the viewport has changed.
 */
export interface ViewportChangeEvent extends TimelineEvent {
    /**
     * Left bound of the visible time range
     */
    start: number;

    /**
     * Right bound of the visible time range
     */
    stop: number;
}
