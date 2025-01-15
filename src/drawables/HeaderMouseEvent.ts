import { TimelineEvent } from '../TimelineEvent';
import { Band } from './Band';

/**
 * Event generated in relation to mouse interactions on Timeline
 * bands.
 */
export interface HeaderMouseEvent extends TimelineEvent {
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
