import { TimelineEvent } from './TimelineEvent';

/**
 * Event generated when the mouse is moving outside the viewport.
 */
export interface ViewportMouseLeaveEvent extends TimelineEvent {

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
}
