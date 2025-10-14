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

    /**
     * Indicates the source of this viewport change event.
     *
     * A source may be set by users of this library when using
     * the setViewRange method.
     */
    source?: string;
}
