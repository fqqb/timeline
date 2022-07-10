import { TimelineEvent } from '../../TimelineEvent';

/**
 * Event generated when a point on a LinePlot was clicked.
 */
export interface PointClickEvent extends TimelineEvent {
    /**
     * Time value of the clicked point.
     */
    time: number;

    /**
     * Value of the clicked point.
     */
    value: number | null;
}
