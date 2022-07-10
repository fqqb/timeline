import { TimelineEvent } from '../../TimelineEvent';

/**
 * Event generated when a point on a LinePlot was hovered.
 */
export interface PointHoverEvent extends TimelineEvent {
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
     * Time value of the hovered point.
     */
    time: number;

    /**
     * Value of the hovered point.
     */
    value: number | null;
}
