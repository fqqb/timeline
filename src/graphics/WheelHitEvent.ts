import { MouseHitEvent } from './MouseHitEvent';

/**
 * Event generated when moving a mouse wheel.
 */
export interface WheelHitEvent extends MouseHitEvent {
    /**
     * Horizontal scroll amount.
     */
    deltaX: number;
    /**
     * Vertical scroll amount.
     */
    deltaY: number;
}
