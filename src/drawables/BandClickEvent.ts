import { TimelineEvent } from '../TimelineEvent';
import { Band } from './Band';

/**
 * Event generated when a Timeline Band was clicked.
 */
export interface BandClickEvent extends TimelineEvent {
    /**
     * The band who's header was clicked.
     */
    band: Band;
}
