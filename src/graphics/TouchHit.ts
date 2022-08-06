/**
 * Single contact point on a touch-sensitive device.
 */
export interface TouchHit {

    /**
     * X-axis coordinate of the mouse pointer (relative to the client area).
     */
    clientX: number;

    /**
     * Y-axis coordinate of the mouse pointer (relative to the client area).
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
}
