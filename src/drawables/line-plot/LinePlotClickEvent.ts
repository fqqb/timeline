import { TimelineEvent } from '../../TimelineEvent';
import { LinePlotPoint } from './LinePlotPoint';

/**
 * Event generated when a LinePlot was clicked.
 */
export interface LinePlotClickEvent extends TimelineEvent {
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

    /**
     * Value matching with the coordinates of the mouse pointer.
     */
    value: number | null;

    /**
     * For each line in index order, the closest point by time.
     */
    points: Array<LinePlotPoint | null>;
}
