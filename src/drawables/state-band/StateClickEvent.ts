import { TimelineEvent } from '../../TimelineEvent';
import { State } from './State';

/**
 * Event generated when a Timeline state was clicked.
 */
export interface StateClickEvent extends TimelineEvent {
    /**
     * The state that was clicked.
     */
    state: State;
}
