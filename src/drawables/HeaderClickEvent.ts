import { TimelineEvent } from '../TimelineEvent';
import { Band } from './Band';

/**
 * Event generated when the header of a Timeline Band was
 * clicked.
 */
export interface HeaderClickEvent extends TimelineEvent {
    /**
     * The band who's header was clicked.
     */
    band: Band;
}
