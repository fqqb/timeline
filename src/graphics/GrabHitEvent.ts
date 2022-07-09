import { MouseHitEvent } from './MouseHitEvent';

/**
 * Event generated while grabbing a hit region.
 */
export interface GrabHitEvent extends MouseHitEvent {
    /**
     * Delta movement on the X-axis, relative to the grab start point.
     */
    dx: number;
    /**
     * Delta movement on the Y-axis, relative to the grab start point.
     */
    dy: number;
}
