import { MouseHitEvent } from './MouseHitEvent';

/**
 * Event generated while clicking on a hit region.
 */
export interface ClickHitEvent extends MouseHitEvent {

    /**
     * Indicates whether the alt/option key was pressed
     * while clicking.
     */
    altKey: boolean;

    /**
     * Indicates whether the ctrl key was pressed while
     * clicking.
     */
    ctrlKey: boolean;

    /**
     * Indicates whether the meta key was pressed while
     * clicking.
     */
    metaKey: boolean;

    /**
     * Indicates whether the shift key was pressed while
     * clicking.
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
