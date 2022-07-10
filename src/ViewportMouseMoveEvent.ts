import { TimelineEvent } from './TimelineEvent';

/**
 * Event generated when the mouse is moving over
 * the viewport.
 */
export interface ViewportMouseMoveEvent extends TimelineEvent {
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
     * Time matching with the coordinates of the mouse pointer.
     */
    time: number;
}
