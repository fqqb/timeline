import { Point } from './positioning';

/**
 * Event generated whiling using a mouse over a hit region.
 */
export interface MouseHitEvent {
    /**
     * X-axis coordinate of the mouse pointer (relative to the client area).
     */
    clientX: number;
    /**
     * Y-axis coordinate of the mouse pointer (relative to the client area).
     */
    clientY: number;
    /**
     * Coordinates relative to the Canvas.
     */
    point: Point;
}
