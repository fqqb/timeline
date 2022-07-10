import { GrabHitEvent } from './GrabHitEvent';
import { HitCanvas } from './HitCanvas';
import { HitRegionSpecification } from './HitRegionSpecification';
import { MouseHitEvent } from './MouseHitEvent';
import { Point } from './Point';

/**
 * Consumes any click event wherever they may originate.
 * Usually there's 0 or 1 when the user ends the grab,
 * depending on where the mouse is released.
 */
const consumeNextClick = (e: MouseEvent) => {
    // Remove ourself. This to prevent capturing unrelated events.
    document.removeEventListener('click', consumeNextClick, true /* Must be same as when created */);

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
    private grabPoint?: { x: number, y: number; }; // Relative to canvas
    private grabbingPoint?: { x: number, y: number; };

    // Global handlers attached only during a grab action.
    // Purpose is to support the user doing grab actions while leaving the canvas.
    private documentMouseMoveListener = (e: MouseEvent) => this.onDocumentMouseMove(e);
    private documentMouseUpListener = (e: MouseEvent) => this.onDocumentMouseUp(e);

    private prevActiveRegions: HitRegionSpecification[] = [];

    constructor(private canvas: HTMLCanvasElement, private hitCanvas: HitCanvas) {
        canvas.addEventListener('click', e => this.onCanvasClick(e), false);
        canvas.addEventListener('dblclick', e => this.onCanvasDoubleClick(e), false);
        canvas.addEventListener('contextmenu', e => this.onCanvasContextMenu(e), false);
        canvas.addEventListener('mousedown', e => this.onCanvasMouseDown(e), false);
        canvas.addEventListener('mouseup', e => this.onCanvasMouseUp(e), false);
        canvas.addEventListener('mouseleave', e => this.onCanvasMouseLeave(e), false);
        canvas.addEventListener('mousemove', e => this.onCanvasMouseMove(e), false);
        canvas.addEventListener('wheel', e => this.onCanvasWheel(e), false);
    }

    private onCanvasClick(domEvent: MouseEvent) {
        const { x, y } = this.toPoint(domEvent);
        const region = this.hitCanvas.getActiveRegion(x, y, 'click');
        if (region) {
            region.click!(this.toMouseHitEvent(domEvent));

            domEvent.preventDefault();
            domEvent.stopPropagation();
            return false;
        }
    }

    private onCanvasDoubleClick(domEvent: MouseEvent) {
        const { x, y } = this.toPoint(domEvent);
        const region = this.hitCanvas.getActiveRegion(x, y, 'doubleClick');
        if (region) {
            region.doubleClick!(this.toMouseHitEvent(domEvent));

            domEvent.preventDefault();
            domEvent.stopPropagation();
            return false;
        }
    }

    private onCanvasContextMenu(domEvent: MouseEvent) {
        const { x, y } = this.toPoint(domEvent);
        const region = this.hitCanvas.getActiveRegion(x, y, 'contextMenu');
        if (region) {
            region.contextMenu!(this.toMouseHitEvent(domEvent));

            domEvent.preventDefault();
            domEvent.stopPropagation();
            return false;
        }
    }

    private onCanvasMouseDown(domEvent: MouseEvent) {
        document.removeEventListener('click', consumeNextClick,
            true /* Must be same as when created */);

        if (isLeftPressed(domEvent)) {
            const { x, y } = this.toPoint(domEvent);

            const mouseDownRegion = this.hitCanvas.getActiveRegion(x, y, 'mouseDown');
            if (mouseDownRegion) {
                mouseDownRegion.mouseDown!(this.toMouseHitEvent(domEvent));
            }

            const grabRegion = this.hitCanvas.getActiveRegion(x, y, 'grab');
            if (grabRegion) {
                this.grabPoint = this.grabbingPoint = { x, y };
                this.grabTarget = grabRegion;
                // Actual grab initialisation is subject to snap (see mousemove)
            }

            domEvent.preventDefault();
            domEvent.stopPropagation();
            return false;
        }
    }

    private onCanvasMouseUp(domEvent: MouseEvent) {
        const { x, y } = this.toPoint(domEvent);
        const region = this.hitCanvas.getActiveRegion(x, y, 'mouseUp');
        if (region) {
            region.mouseUp!(this.toMouseHitEvent(domEvent));

            domEvent.preventDefault();
            domEvent.stopPropagation();
            return false;
        }
    }

    private onCanvasMouseLeave(domEvent: MouseEvent) {
        const mouseEvent = this.toMouseHitEvent(domEvent);
        for (const region of this.prevActiveRegions) {
            region.mouseLeave && region.mouseLeave(mouseEvent);
        }
        this.prevActiveRegions = [];

        domEvent.preventDefault();
        domEvent.stopPropagation();
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
        const mouseEvent = this.toMouseHitEvent(domEvent);
        const { x, y } = mouseEvent;

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
                    this.grabPoint = this.grabbingPoint = { x, y };
                }
            }
        }

        if (this.grabbing && this.grabTarget && isLeftPressed(domEvent)) {
            domEvent.preventDefault();
            domEvent.stopPropagation();

            this.grabTarget.grab!(this.toGrabHitEvent(domEvent));
            this.grabbingPoint = { x, y };
        }
    }

    private initiateGrab() {
        document.addEventListener('click', consumeNextClick, true /* capture ! */);
        document.addEventListener('mouseup', this.documentMouseUpListener);
        document.addEventListener('mousemove', this.documentMouseMoveListener);
        this.grabbing = true;
    }

    private onCanvasWheel(domEvent: WheelEvent) {
        const mouseEvent = this.toMouseHitEvent(domEvent);
        const { x, y } = mouseEvent;
        const region = this.hitCanvas.getActiveRegion(x, y, 'wheel');
        if (region) {
            region.wheel!({
                ...mouseEvent,
                deltaX: domEvent.deltaX,
                deltaY: domEvent.deltaY,
            });

            domEvent.preventDefault();
            domEvent.stopPropagation();
            return false;
        }
    }

    private onDocumentMouseUp(domEvent: MouseEvent) {
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

    private toPoint(domEvent: MouseEvent): Point {
        const bbox = this.canvas.getBoundingClientRect();
        return { x: domEvent.clientX - bbox.left, y: domEvent.clientY - bbox.top };
    }

    private toMouseHitEvent(domEvent: MouseEvent): MouseHitEvent {
        return {
            clientX: domEvent.clientX,
            clientY: domEvent.clientY,
            ...this.toPoint(domEvent),
            altKey: domEvent.altKey,
            ctrlKey: domEvent.ctrlKey,
            metaKey: domEvent.metaKey,
            shiftKey: domEvent.shiftKey,
            button: domEvent.button,
        };
    }

    private toGrabHitEvent(domEvent: MouseEvent): GrabHitEvent {
        const mouseHitEvent = this.toMouseHitEvent(domEvent);
        return {
            ...mouseHitEvent,
            deltaX: mouseHitEvent.x - this.grabPoint!.x,
            deltaY: mouseHitEvent.y - this.grabPoint!.y,
            movementX: mouseHitEvent.x - this.grabbingPoint!.x,
            movementY: mouseHitEvent.y - this.grabbingPoint!.y,
        };
    }
}
