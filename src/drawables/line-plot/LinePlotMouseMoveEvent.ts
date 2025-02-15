import { BandMouseMoveEvent } from '../BandMouseMoveEvent';
import { LinePlotPoint } from './LinePlotPoint';

/**
 * Event generated when the mouse is moving over a LinePlot.
 */
export interface LinePlotMouseMoveEvent extends BandMouseMoveEvent {
    /**
     * Time matching with the coordinates of the mouse pointer.
     */
    time: number;

    /**
     * For each line in index order, the closest point by time.
     */
    points: Array<LinePlotPoint | null>;
}
