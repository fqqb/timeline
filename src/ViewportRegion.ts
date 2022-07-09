import { GrabHitEvent } from './graphics/GrabHitEvent';
import { HitRegionSpecification } from './graphics/HitRegionSpecification';
import { MouseHitEvent } from './graphics/MouseHitEvent';
import { Point } from './graphics/positioning';
import { WheelHitEvent } from './graphics/WheelHitEvent';
import { Timeline } from './Timeline';

export class ViewportRegion implements HitRegionSpecification {
    id: string;

    private grabStartPoint?: Point;
    private grabStartCursor?: string;

    constructor(id: string, private timeline: Timeline) {
        this.id = id;
    }

    click() {
        this.timeline.clearSelection();
    }

    mouseDown(mouseEvent: MouseHitEvent) {
        this.grabStartPoint = mouseEvent.point;
        this.grabStartCursor = this.timeline.cursor;
    }

    grab(grabEvent: GrabHitEvent) {
        switch (this.timeline.tool) {
            case 'hand':
                this.timeline.cursor = 'grabbing';
                this.timeline.panBy(-grabEvent.dx, false);
                this.timeline.eventHandler.grabPoint = grabEvent.point;
                break;
            case 'range-select':
                this.timeline.cursor = 'col-resize';
                const start = this.timeline.timeForCanvasPosition(this.grabStartPoint!.x);
                const stop = this.timeline.timeForCanvasPosition(grabEvent.point.x);
                this.timeline.setSelection(start, stop);
                break;
        }
    }

    grabEnd() {
        this.timeline.cursor = this.grabStartCursor || this.timeline.cursor;
    }

    wheel(wheelEvent: WheelHitEvent) {
        if (wheelEvent.dx > 0) {
            this.timeline.panBy(50);
        } else if (wheelEvent.dx < 0) {
            this.timeline.panBy(-50);
        }

        const relto = this.timeline.timeForCanvasPosition(wheelEvent.point.x);
        if (wheelEvent.dy > 0) {
            this.timeline.zoom(2, true, relto);
        } else if (wheelEvent.dy < 0) {
            this.timeline.zoom(0.5, true, relto);
        }
    }

    mouseLeave(mouseEvent: MouseHitEvent) {
        console.log('mouseleave', mouseEvent);
    }
}
