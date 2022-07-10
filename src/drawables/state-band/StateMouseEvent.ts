import { TimelineEvent } from '../../TimelineEvent';
import { State } from './State';

/**
 * Event generated in relation to mouse interactions on Timeline
 * states.
 */
export interface StateMouseEvent extends TimelineEvent {
    /**
     * Horizontal coordinate of the mouse pointer, relative to
     * the browser page.
     */
    clientX: number;

    /**
     * Vertical coordinate of the mouse pointer, relative to the
     * browser page.
     */
    clientY: number;

    /**
     * The applicable state.
     */
    state: State;
}
