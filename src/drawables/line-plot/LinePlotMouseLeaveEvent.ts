import { TimelineEvent } from '../../TimelineEvent';

/**
 * Event generated when the mouse is moving outside a LinePlot.
 */
export interface LinePlotMouseLeaveEvent extends TimelineEvent {
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
