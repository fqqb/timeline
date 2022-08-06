/**
 * Event generated while grabbing a hit region.
 */
export interface GrabHitEvent {

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

    /**
     * Indicates whether the alt/option key was pressed.
     */
    altKey: boolean;

    /**
     * Indicates whether the ctrl key was pressed.
     */
    ctrlKey: boolean;

    /**
     * Indicates whether the meta key was pressed.
     */
    metaKey: boolean;

    /**
     * Indicates whether the shift key was pressed.
     */
    shiftKey: boolean;

    /**
     * Delta movement on the X-axis, relative to the grab start point.
     */
    deltaX: number;

    /**
     * Delta movement on the Y-axis, relative to the grab start point.
     */
    deltaY: number;

    /**
     * Movement on the X-axis, relative to the previous mousemove
     * event.
     */
    movementX: number;

    /**
     * Movement on the Y-axis, relative to the previous mousemove
     * event.
     */
    movementY: number;
}
