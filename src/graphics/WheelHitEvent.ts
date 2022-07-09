import { MouseHitEvent } from './MouseHitEvent';

/**
 * Event generated when moving a mouse wheel.
 */
export interface WheelHitEvent extends MouseHitEvent {
    dx: number;
    dy: number;
}
