import { GrabHitEvent } from './graphics/GrabHitEvent';
import { HitRegionSpecification } from './graphics/HitRegionSpecification';
import { SidebarPosition } from './SidebarPosition';
import { Timeline } from './Timeline';

const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

export class DividerRegion implements HitRegionSpecification {
    id: string;
    cursor = 'col-resize';

    private grabStartCursor?: string;

    constructor(id: string, private timeline: Timeline, private position: SidebarPosition) {
        this.id = id;
    }

    mouseDown() {
        this.grabStartCursor = this.timeline.cursor;
    }

    grab(grabEvent: GrabHitEvent) {
        // Clamp x to avoid interactions where the divider
        // moves beyond reach

        if (this.position === 'left' && this.timeline.leftSidebar) {
            const rightSidebarWidth = this.timeline.rightSidebar?.clippedWidth || 0;
            const x = clamp(grabEvent.x, 0, this.timeline.width - rightSidebarWidth - 5);
            this.timeline.cursor = 'col-resize';
            this.timeline.leftSidebar.width = x;
        } else if (this.position === 'right' && this.timeline.rightSidebar) {
            const leftSidebarWidth = this.timeline.leftSidebar?.clippedWidth || 0;
            const x = clamp(grabEvent.x, 5 + leftSidebarWidth, this.timeline.width);
            this.timeline.cursor = 'col-resize';
            this.timeline.rightSidebar.width = this.timeline.width - x;
        }
    }

    grabEnd() {
        this.timeline.cursor = this.grabStartCursor || this.timeline.cursor;
    }
}
