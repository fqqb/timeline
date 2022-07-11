
/**
 * Event generated while using a mouse over a hit region.
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
     * Indicates which button was pressed on the mouse.
     *
     * * 0: Main button (left)
     * * 1: Auxiliary button (wheel, middle)
     * * 2: Secondary button (right)
     * * 3: Fourth button (browser-back)
     * * 4: Fifth button (browser-forward)
     */
    button: number;
}
