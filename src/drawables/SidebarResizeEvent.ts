import { TimelineEvent } from '../TimelineEvent';

/**
 * Event generated when the sidebar width changes.
 */
export interface SidebarResizeEvent extends TimelineEvent {

    /**
     * Sidebar width
     */
    width: number;
}
