import { TimelineEvent } from './TimelineEvent';

/**
 * Event generated when the mouse is moving outside the viewport.
 */
export interface ViewportMouseLeaveEvent extends TimelineEvent {

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
}
