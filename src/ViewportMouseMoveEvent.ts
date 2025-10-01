import { TimelineEvent } from './TimelineEvent';

/**
 * Event generated when the mouse is moving over
 * the viewport.
 */
export interface ViewportMouseMoveEvent extends TimelineEvent {

    /**
     * X-axis coordinate of the mouse pointer (relative to
     * the client area).
     */
    clientX: number;

    /**
     * Y-axis coordinate of the mouse pointer (relative to the
     * client area).
     */
    clientY: number;

    /**
     * X-axis coordinate relative to the Canvas.
     */
    x: number;

    /**
     * Y-axis coordinate relative to the Canvas.
     */
    y: number;

    /**
     * Time matching with the coordinates of the mouse pointer.
     */
    time: number;
}
