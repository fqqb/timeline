import { GrabHitEvent } from './GrabHitEvent';
import { KeyboardHitEvent } from './KeyboardHitEvent';
import { MouseHitEvent } from './MouseHitEvent';
import { WheelHitEvent } from './WheelHitEvent';


/**
 * Specifies which properties a hit region responds too.
 */
export interface HitRegionSpecification {
    /**
     * Unique identifier for this region.
     *
     * While it is preferred to make hit regions outside of
     * the draw loop, it is allowed and the ID is what establishes
     * conceptually a unique region.
     */
    id: string;

    /**
     * Optional identifier of a parent region. Some region
     * properties 'bubble up' to parent regions.
     *
     * For example if a cursor is set on a parent, but not
     * on the child region, the parent's cursor will be
     * displayed even if the child is hovered.
     */
    parentId?: string;

    /**
     * Cursor on hover.
     */
    cursor?: string;

    /**
     * Callback when this region is clicked.
     */
    click?: (event: MouseHitEvent) => void;

    /**
     * Callback when this region is double-clicked.
     */
    doubleClick?: (event: MouseHitEvent) => void;

    /**
     * Callback when the user attempts to open a context menu.
     * (usually by right click).
     */
    contextMenu?: (event: MouseHitEvent) => void;

    /**
     * Callback when the mouse enters this region.
     */
    mouseEnter?: (event: MouseHitEvent) => void;

    /**
     * Callback when the mouse moves over this region
     * (or any child regions).
     */
    mouseMove?: (event: MouseHitEvent) => void;

    /**
     * Callback when the mouse leaves this region.
     */
    mouseLeave?: (event: MouseHitEvent) => void;

    /**
     * Callback when a mouse-down occurs on this region.
     */
    mouseDown?: (event: MouseHitEvent) => void;

    /**
     * Callback when a mouse-up occurs on this region.
     */
    mouseUp?: (event: MouseHitEvent) => void;

    /**
     * Callback while a grab of this region is going on.
     *
     * Grab events trigger when a click-and-drag is recorded on the hit
     * region.
     */
    grab?: (event: GrabHitEvent) => void;

    /**
     * Callback when a grab has ended that was initiated on this region.
     */
    grabEnd?: () => void;

    /**
     * Callback when a wheel event occus on this region.
     */
    wheel?: (event: WheelHitEvent) => void;

    /**
     * Callback when a key is pressed.
     */
    keyDown?: (event: KeyboardHitEvent) => void;

    /**
     * Callback when a key is released.
     */
    keyUp?: (event: KeyboardHitEvent) => void;
}
