import { TimelineEvent } from '../TimelineEvent';
import { Band } from './Band';

/**
 * Event generated when the mouse is leaving a band.
 */
export interface BandMouseLeaveEvent extends TimelineEvent {
    /**
     * Horizontal coordinate of the mouse pointer, relative to
     * the browser page.
     */
    clientX: number;

    /**
     * Vertical coordinate of the mouse pointer, relative to the
     * browser page.
     */
    clientY: number;

    /**
     * The applicable band.
     */
    band: Band;
}
