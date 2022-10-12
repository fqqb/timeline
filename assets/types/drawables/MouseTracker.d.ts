import { Timeline } from '../Timeline';
import { TimeLocator } from './TimeLocator';
/**
 * Displays a vertical bar matching the time where the mouse is hovering.
 */
export declare class MouseTracker extends TimeLocator {
    private mouseMoveListener;
    private mouseLeaveListener;
    /**
     * @param timeline Timeline instance that this drawable is bound to.
     */
    constructor(timeline: Timeline);
    disconnectedCallback(): void;
}
