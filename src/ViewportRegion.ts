import { GrabHitEvent } from './graphics/GrabHitEvent';
import { HitRegionSpecification } from './graphics/HitRegionSpecification';
import { MouseHitEvent } from './graphics/MouseHitEvent';
import { Point } from './graphics/Point';
import { WheelHitEvent } from './graphics/WheelHitEvent';
import { Timeline } from './Timeline';
import { ViewportMouseLeaveEvent } from './ViewportMouseLeaveEvent';
import { ViewportMouseMoveEvent } from './ViewportMouseMoveEvent';

export class ViewportRegion implements HitRegionSpecification {
    id: string;

    private grabStartPoint?: Point;
    private grabStartCursor?: string;

    private mouseMoveListeners: Array<(ev: ViewportMouseMoveEvent) => void> = [];
    private mouseLeaveListeners: Array<(ev: ViewportMouseLeaveEvent) => void> = [];

    constructor(id: string, private timeline: Timeline) {
        this.id = id;
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * over the viewport.
     */
    addMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void) {
        this.mouseMoveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * viewport mouse-move events.
     */
    removeMouseMoveListener(listener: (ev: ViewportMouseMoveEvent) => void) {
        this.mouseMoveListeners = this.mouseMoveListeners
            .filter(el => (el !== listener));
    }

    /**
     * Register a listener that receives updates whenever the mouse is moving
     * outside the viewport.
     */
    addMouseLeaveListener(listener: (ev: ViewportMouseLeaveEvent) => void) {
        this.mouseLeaveListeners.push(listener);
    }

    /**
     * Unregister a previously registered listener to stop receiving
     * mouse-leave events.
     */
    removeMouseLeaveListener(listener: (ev: ViewportMouseLeaveEvent) => void) {
        this.mouseLeaveListeners = this.mouseLeaveListeners
            .filter(el => (el !== listener));
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
                this.timeline.panBy(-grabEvent.deltaX, false);
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
        if (wheelEvent.deltaX > 0) {
            this.timeline.panBy(50);
        } else if (wheelEvent.deltaX < 0) {
            this.timeline.panBy(-50);
        }

        const relto = this.timeline.timeForCanvasPosition(wheelEvent.point.x);
        if (wheelEvent.deltaY > 0) {
            this.timeline.zoom(2, true, relto);
        } else if (wheelEvent.deltaY < 0) {
            this.timeline.zoom(0.5, true, relto);
        }
    }

    mouseMove(mouseEvent: MouseHitEvent) {
        const vpEvent: ViewportMouseMoveEvent = {
            clientX: mouseEvent.clientX,
            clientY: mouseEvent.clientY,
            time: this.timeline.timeForCanvasPosition(mouseEvent.point.x),
        };
        this.mouseMoveListeners.forEach(l => l(vpEvent));
    }

    mouseLeave(mouseEvent: MouseHitEvent) {
        const vpEvent: ViewportMouseLeaveEvent = {
            clientX: mouseEvent.clientX,
            clientY: mouseEvent.clientY,
        };
        this.mouseLeaveListeners.forEach(l => l(vpEvent));
    }
}
