import { GrabHitEvent } from './graphics/GrabHitEvent';
import { HitRegionSpecification } from './graphics/HitRegionSpecification';
import { Timeline } from './Timeline';

export class DividerRegion implements HitRegionSpecification {
    id: string;
    cursor = 'col-resize';

    private grabStartCursor?: string;

    constructor(id: string, private timeline: Timeline) {
        this.id = id;
    }

    mouseDown() {
        this.grabStartCursor = this.timeline.cursor;
    }

    grab(grabEvent: GrabHitEvent) {
        if (this.timeline.sidebar) {
            this.timeline.cursor = 'col-resize';
            this.timeline.sidebar.width = grabEvent.point.x;
        }
    }

    grabEnd() {
        this.timeline.cursor = this.grabStartCursor || this.timeline.cursor;
    }
}
