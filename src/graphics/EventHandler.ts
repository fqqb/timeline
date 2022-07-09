import { Timeline } from '../Timeline';
import { HitCanvas } from './HitCanvas';
import { HitRegionSpecification } from './HitRegionSpecification';
import { MouseHitEvent } from './MouseHitEvent';
import { Point } from './positioning';

/**
 * Consumes any click event wherever they may originate.
 * Usually there's 0 or 1 when the user ends the grab,
 * depending on where the mouse is released.
 */
const clickBlocker = (e: MouseEvent) => {
    // Remove ourself. This to prevent capturing unrelated events.
    document.removeEventListener('click', clickBlocker, true /* Must be same as when created */);

    e.preventDefault();
    e.stopPropagation();
    return false;
};

function isLeftPressed(e: MouseEvent) {
    return (e.buttons & 1) === 1 || (e.buttons === undefined && e.which == 1);
}

/**
 * Minimum movement required before a viewport is in "grab" mode.
 * This allows to distinguish grab from regular clicks.
 */
const snap = 5;

function measureDistance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Compare by id instead of references. HitRegions are allowed to be generated
// on each draw, whereas the "id" could be something more long-term.
function regionMatches(region1?: HitRegionSpecification, region2?: HitRegionSpecification) {
    return region1 && region2 && region1.id === region2.id;
}

/**
 * Translates Canvas DOM events into non-DOM hit events.
 */
export class EventHandler {

    private grabbing = false;
    private grabTarget?: HitRegionSpecification;
    grabPoint?: { x: number, y: number; }; // Relative to canvas

    private isViewportHover = false;

    // Global handlers attached only during a grab action.
    // Purpose is to support the user doing grab actions while leaving the canvas.
    private documentMouseMoveListener = (e: MouseEvent) => this.onDocumentMouseMove(e);
    private documentMouseUpListener = (e: MouseEvent) => this.onDocumentMouseUp(e);

    private prevEnteredRegion?: HitRegionSpecification;

    constructor(private timeline: Timeline, private canvas: HTMLCanvasElement, private hitCanvas: HitCanvas) {
        canvas.addEventListener('click', e => this.onCanvasClick(e), false);
        canvas.addEventListener('mousedown', e => this.onCanvasMouseDown(e), false);
        canvas.addEventListener('mouseup', e => this.onCanvasMouseUp(e), false);
        canvas.addEventListener('mouseleave', e => this.onCanvasMouseLeave(e), false);
        canvas.addEventListener('mousemove', e => this.onCanvasMouseMove(e), false);
        canvas.addEventListener('wheel', e => this.onCanvasWheel(e), false);
    }

    private toPoint(event: MouseEvent): Point {
        const bbox = this.canvas.getBoundingClientRect();
        return { x: event.clientX - bbox.left, y: event.clientY - bbox.top };
    }

    private toCanvasMouseEvent(domEvent: MouseEvent): Omit<MouseHitEvent, 'bubbles'> {
        return {
            clientX: domEvent.clientX,
            clientY: domEvent.clientY,
            point: this.toPoint(domEvent),
        };
    }

    private onCanvasClick(domEvent: MouseEvent) {
        const { x, y } = this.toPoint(domEvent);
        const region = this.hitCanvas.getActiveRegion(x, y, 'click');
        region?.click!();
    }

    private onCanvasMouseDown(event: MouseEvent) {
        document.removeEventListener('click', clickBlocker, true /* Must be same as when created */);

        if (isLeftPressed(event)) {
            const { x, y } = this.toPoint(event);

            const mouseDownRegion = this.hitCanvas.getActiveRegion(x, y, 'mouseDown');
            if (mouseDownRegion) {
                const mouseEvent = this.toCanvasMouseEvent(event);
                mouseDownRegion.mouseDown!(mouseEvent);
            }

            const grabRegion = this.hitCanvas.getActiveRegion(x, y, 'grab');
            if (grabRegion) {
                this.grabPoint = { x, y };
                this.grabTarget = grabRegion;
                // Actual grab initialisation is subject to snap (see mousemove)
            }

            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }

    private onCanvasMouseUp(event: MouseEvent) {
        const { x, y } = this.toPoint(event);
        const region = this.hitCanvas.getActiveRegion(x, y, 'mouseUp');
        region?.mouseUp!();
    }

    private onCanvasMouseLeave(event: MouseEvent) {
        if (this.prevEnteredRegion?.mouseLeave) {
            const mouseEvent = this.toCanvasMouseEvent(event);
            this.prevEnteredRegion.mouseLeave(mouseEvent);
        }
        this.prevEnteredRegion = undefined;

        this.maybeFireViewportMouseLeave(event);
        this.isViewportHover = false;

        event.preventDefault();
        event.stopPropagation();
    }

    private onCanvasMouseMove(domEvent: MouseEvent) {
        const mouseEvent = this.toCanvasMouseEvent(domEvent);
        const { point } = mouseEvent;

        let overViewport = true;
        const sidebarWidth = this.timeline.sidebar?.clippedWidth || 0;
        if (this.timeline.sidebar) {
            const overSidebar = point.x <= sidebarWidth - 5;
            const overDivider = !overSidebar && point.x <= sidebarWidth + 5;
            overViewport = !overSidebar && !overDivider;
        }

        if (!overViewport) {
            this.maybeFireViewportMouseLeave(domEvent);
        }
        this.isViewportHover = overViewport;

        if (overViewport) {
            this.timeline.fireViewportMouseMoveEvent({
                clientX: domEvent.clientX,
                clientY: domEvent.clientY,
                time: this.timeline.timeForCanvasPosition(point.x),
            });
        }

        const region = this.hitCanvas.getActiveRegion(point.x, point.y);

        if (this.prevEnteredRegion?.mouseLeave) {
            if (!regionMatches(this.prevEnteredRegion, region)) {
                this.prevEnteredRegion.mouseLeave(mouseEvent);
            }
        }

        if (region?.mouseEnter) {
            if (!regionMatches(this.prevEnteredRegion, region)) {
                region.mouseEnter(mouseEvent);
            }
        }

        if (region?.mouseMove) {
            region.mouseMove(mouseEvent);
        }

        this.prevEnteredRegion = region;

        const cursorRegion = this.hitCanvas.getActiveRegion(point.x, point.y, 'cursor');
        const cursor = cursorRegion?.cursor || 'auto';
        if (cursor !== this.canvas.style.cursor) {
            this.canvas.style.cursor = cursor;
        }

        if (this.grabPoint && !this.grabbing && isLeftPressed(domEvent)) {
            const distance = measureDistance(this.grabPoint.x, this.grabPoint.y, point.x, point.y);
            if (Math.abs(distance) > snap) {
                this.initiateGrab();
                // Prevent stutter on first move
                if (snap > 0 && this.grabPoint) {
                    this.grabPoint = point;
                }
            }
        }

        if (this.grabbing && this.grabTarget && isLeftPressed(domEvent)) {
            domEvent.preventDefault();
            domEvent.stopPropagation();

            this.grabTarget.grab!({
                ...this.toCanvasMouseEvent(domEvent),
                dx: point.x - this.grabPoint!.x,
                dy: point.y - this.grabPoint!.y,
            });
        }
    }

    private initiateGrab() {
        document.addEventListener('click', clickBlocker, true /* capture ! */);
        document.addEventListener('mouseup', this.documentMouseUpListener);
        document.addEventListener('mousemove', this.documentMouseMoveListener);
        this.grabbing = true;
    }

    private onCanvasWheel(event: WheelEvent) {
        const mouseEvent = this.toCanvasMouseEvent(event);
        const { x, y } = mouseEvent.point;
        const region = this.hitCanvas.getActiveRegion(x, y, 'wheel');
        if (region) {
            region.wheel!({
                ...mouseEvent,
                dx: event.deltaX,
                dy: event.deltaY,
            });

            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }

    private onDocumentMouseUp(event: MouseEvent) {
        if (this.grabbing) {
            document.removeEventListener('mouseup', this.documentMouseUpListener);
            document.removeEventListener('mousemove', this.documentMouseMoveListener);
            const grabTarget = this.grabTarget;
            this.grabbing = false;
            this.grabPoint = undefined;
            this.grabTarget = undefined;
            if (grabTarget?.grabEnd) {
                grabTarget.grabEnd();
            }
        }
    }

    private onDocumentMouseMove(event: MouseEvent) {
        this.onCanvasMouseMove(event);
    }

    private maybeFireViewportMouseLeave(event: MouseEvent) {
        if (this.isViewportHover) {
            this.timeline.fireViewportMouseLeaveEvent({
                clientX: event.clientX,
                clientY: event.clientY,
            });
        }
    }
}
