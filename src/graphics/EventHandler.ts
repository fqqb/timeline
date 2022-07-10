import { HitCanvas } from './HitCanvas';
import { HitRegionSpecification } from './HitRegionSpecification';
import { MouseHitEvent } from './MouseHitEvent';
import { Point } from './Point';

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

/**
 * Translates Canvas DOM events into non-DOM hit events.
 */
export class EventHandler {

    private grabbing = false;
    private grabTarget?: HitRegionSpecification;
    grabPoint?: { x: number, y: number; }; // Relative to canvas

    // Global handlers attached only during a grab action.
    // Purpose is to support the user doing grab actions while leaving the canvas.
    private documentMouseMoveListener = (e: MouseEvent) => this.onDocumentMouseMove(e);
    private documentMouseUpListener = (e: MouseEvent) => this.onDocumentMouseUp(e);

    private prevActiveRegions: HitRegionSpecification[] = [];

    constructor(private canvas: HTMLCanvasElement, private hitCanvas: HitCanvas) {
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
        const mouseEvent = this.toCanvasMouseEvent(event);
        for (const region of this.prevActiveRegions) {
            region.mouseLeave && region.mouseLeave(mouseEvent);
        }
        this.prevActiveRegions = [];

        event.preventDefault();
        event.stopPropagation();
    }

    private wasActive(region: HitRegionSpecification) {
        for (const candidate of this.prevActiveRegions) {
            if (candidate.id === region.id) {
                return true;
            }
        }
        return false;
    }

    private onCanvasMouseMove(domEvent: MouseEvent) {
        const mouseEvent = this.toCanvasMouseEvent(domEvent);
        const { x, y } = mouseEvent.point;

        const activeRegions = this.hitCanvas.getActiveRegions(x, y);
        const activeRegionIds = activeRegions.map(r => r.id);

        for (const region of this.prevActiveRegions) {
            if (activeRegionIds.indexOf(region.id) === -1) {
                region.mouseLeave && region.mouseLeave(mouseEvent);
            }
        }

        const mouseEnterRegions = this.hitCanvas.getActiveRegions(x, y, 'mouseEnter');
        for (let i = mouseEnterRegions.length - 1; i >= 0; i--) { // Top-down
            const mouseEnterRegion = mouseEnterRegions[i];
            if (!this.wasActive(mouseEnterRegion)) {
                mouseEnterRegion.mouseEnter!(mouseEvent);
            }
        }

        for (const region of this.hitCanvas.getActiveRegions(x, y, 'mouseMove')) {
            region.mouseMove!(mouseEvent);
        }

        this.prevActiveRegions = activeRegions;

        const cursorRegion = this.hitCanvas.getActiveRegion(x, y, 'cursor');
        const cursor = cursorRegion?.cursor || 'auto';
        if (cursor !== this.canvas.style.cursor) {
            this.canvas.style.cursor = cursor;
        }

        if (this.grabPoint && !this.grabbing && isLeftPressed(domEvent)) {
            const distance = measureDistance(this.grabPoint.x, this.grabPoint.y, x, y);
            if (Math.abs(distance) > snap) {
                this.initiateGrab();
                // Prevent stutter on first move
                if (snap > 0 && this.grabPoint) {
                    this.grabPoint = mouseEvent.point;
                }
            }
        }

        if (this.grabbing && this.grabTarget && isLeftPressed(domEvent)) {
            domEvent.preventDefault();
            domEvent.stopPropagation();

            this.grabTarget.grab!({
                ...this.toCanvasMouseEvent(domEvent),
                deltaX: x - this.grabPoint!.x,
                deltaY: y - this.grabPoint!.y,
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
            console.log(event);
            region.wheel!({
                ...mouseEvent,
                deltaX: event.deltaX,
                deltaY: event.deltaY,
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
}
