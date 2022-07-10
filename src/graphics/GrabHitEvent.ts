import { MouseHitEvent } from './MouseHitEvent';

/**
 * Event generated while grabbing a hit region.
 */
export interface GrabHitEvent extends MouseHitEvent {

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
