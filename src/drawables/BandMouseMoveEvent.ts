import { TimelineEvent } from '../TimelineEvent';
import { Band } from './Band';

/**
 * Event generated when the mouse is moving over
 * a band.
 */
export interface BandMouseMoveEvent extends TimelineEvent {
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

    /**
     * Time matching with the coordinates of the mouse pointer.
     */
    time: number;
}
