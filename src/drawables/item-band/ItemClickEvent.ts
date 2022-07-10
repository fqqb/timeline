import { TimelineEvent } from '../../TimelineEvent';
import { Item } from './Item';

/**
 * Event generated when a Timeline item was clicked.
 */
export interface ItemClickEvent extends TimelineEvent {
    /**
     * The item that was clicked.
     */
    item: Item;
}
