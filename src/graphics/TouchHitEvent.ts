import { TouchHit } from './TouchHit';

/**
 * Event generated while touching a hit region
 */
export interface TouchHitEvent {

    /**
     * Contact points on a touch surface.
     */
    touches: TouchHit[];

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
}
