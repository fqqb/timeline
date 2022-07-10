import { TimelineEvent } from '../../TimelineEvent';
import { Item } from './Item';

/**
 * Event generated in relation to mouse interactions on Timeline
 * items.
 */
export interface ItemMouseEvent extends TimelineEvent {
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
     * The applicable item.
     */
    item: Item;
}
