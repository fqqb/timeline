import { ViewportMouseMoveEvent, ViewportMouseOutEvent } from './events';
import { HitCanvas, HitRegionSpecification } from './HitCanvas';
import { Point } from './positioning';
import { Timeline } from './Timeline';

/**
 * Swallows any click event wherever they may originate.
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

export type Tool = 'hand' | 'range-select';

// Compare by id instead of references. HitRegions are allowed to be generated
// on each draw, whereas the "id" could be something more long-term.
function regionMatches(region1?: HitRegionSpecification, region2?: HitRegionSpecification) {
    return region1 && region2 && region1.id === region2.id;
}

export interface TimelineMouseEvent {
    point: Point;
    viewportPoint: Point;
    overSidebar: boolean;
    overDivider: boolean;
    overViewport: boolean;
}

export class DOMEventHandler {

    tool?: Tool = 'hand';

    private grabbing = false;
    private grabTarget?: 'DIVIDER' | 'VIEWPORT';
    private grabPoint?: { x: number, y: number; }; // Relative to canvas

    private isDividerHover = false;
    private isViewportHover = false;

    // Global handlers attached only during a grab action.
    // Purpose is to support the user doing grab actions while leaving our canvas.
    private documentMouseMoveListener = (e: MouseEvent) => this.onDocumentMouseMove(e);
    private documentMouseUpListener = (e: MouseEvent) => this.onDocumentMouseUp(e);
    // private documentMouseLeaveListener = (e: any) => this.onDocumentMouseLeave(e);

    private prevEnteredRegion?: HitRegionSpecification;

    constructor(private timeline: Timeline, private canvas: HTMLCanvasElement, private hitCanvas: HitCanvas) {
        canvas.addEventListener('click', e => this.onCanvasClick(e), false);
        canvas.addEventListener('mousedown', e => this.onCanvasMouseDown(e), false);
        canvas.addEventListener('mouseout', e => this.onCanvasMouseOut(e), false);
        canvas.addEventListener('mousemove', e => this.onCanvasMouseMove(e), false);
        canvas.addEventListener('wheel', e => this.onWheel(e), false);
    }

    private toPoint(event: MouseEvent): Point {
        const bbox = this.canvas.getBoundingClientRect();
        return { x: event.clientX - bbox.left, y: event.clientY - bbox.top };
    }

    private toTimelineMouseEvent(domEvent: MouseEvent): TimelineMouseEvent {
        const point = this.toPoint(domEvent);
        const sidebarWidth = this.timeline.sidebar?.clippedWidth || 0;

        let overSidebar;
        let overDivider;
        let overViewport;
        if (this.timeline.sidebar) {
            overSidebar = point.x <= sidebarWidth - 5;
            overDivider = !overSidebar && point.x <= sidebarWidth + 5;
            overViewport = !overSidebar && !overDivider;
        } else {
            overSidebar = false;
            overDivider = false;
            overViewport = true;
        }

        return {
            point,
            viewportPoint: { x: point.x - sidebarWidth, y: point.y },
            overSidebar,
            overDivider,
            overViewport,
        };
    }

    private onCanvasClick(domEvent: MouseEvent) {
        this.timeline.clearSelection();

        const mouseEvent = this.toTimelineMouseEvent(domEvent);
        if (mouseEvent.overViewport) {
            const region = this.hitCanvas.getActiveRegion(
                mouseEvent.viewportPoint.x, mouseEvent.viewportPoint.y);
            region?.click && region.click();
        }
    }

    private onCanvasMouseDown(event: MouseEvent) {
        document.removeEventListener('click', clickBlocker, true /* Must be same as when created */);

        if (isLeftPressed(event)) {
            const sidebarWidth = this.timeline.sidebar?.clippedWidth || 0;
            const bbox = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - bbox.left;
            const mouseY = event.clientY - bbox.top;

            if (this.timeline.sidebar && sidebarWidth - 5 < mouseX && mouseX <= sidebarWidth + 5) {
                this.grabTarget = 'DIVIDER';
                this.grabPoint = { x: mouseX, y: mouseY };
                this.initiateGrab(); // No snap detection for this

                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (this.tool) {
                this.grabTarget = 'VIEWPORT';
                this.grabPoint = { x: mouseX, y: mouseY };
                // Actual grab initialisation is subject to snap (see mousemove)

                event.preventDefault();
                event.stopPropagation();
                return false;
            }
        }
    }

    private onCanvasMouseOut(event: MouseEvent) {
        this.maybeFireViewportMouseOut(event);
        this.isViewportHover = false;

        event.preventDefault();
        event.stopPropagation();
    }

    private onCanvasMouseMove(domEvent: MouseEvent) {
        const mouseEvent = this.toTimelineMouseEvent(domEvent);

        if (!mouseEvent.overViewport) {
            this.maybeFireViewportMouseOut(domEvent);
        }
        this.isViewportHover = mouseEvent.overViewport;
        this.isDividerHover = mouseEvent.overDivider;

        let defaultCursor = 'default';
        if (mouseEvent.overViewport) {
            const vpEvent: ViewportMouseMoveEvent = {
                clientX: domEvent.clientX,
                clientY: domEvent.clientY,
                viewportX: mouseEvent.viewportPoint.x,
                viewportY: mouseEvent.viewportPoint.y,
                time: this.mouse2time(mouseEvent.point.x),
            };
            this.timeline.fireEvent('viewportmousemove', vpEvent);

            const region = this.hitCanvas.getActiveRegion(
                mouseEvent.viewportPoint.x, mouseEvent.viewportPoint.y);

            if (this.prevEnteredRegion && this.prevEnteredRegion.mouseOut) {
                if (!regionMatches(this.prevEnteredRegion, region)) {
                    this.prevEnteredRegion.mouseOut();
                }
            }

            if (region && region.mouseEnter) {
                if (!regionMatches(this.prevEnteredRegion, region)) {
                    region.mouseEnter();
                }
            }

            this.prevEnteredRegion = region;
            defaultCursor = region?.cursor || 'default';
        }

        if (this.grabPoint && !this.grabbing && isLeftPressed(domEvent)) {
            const { point } = mouseEvent;
            const distance = measureDistance(this.grabPoint.x, this.grabPoint.y, point.x, point.y);
            if (Math.abs(distance) > snap) {
                this.initiateGrab();
                // Prevent stutter on first move
                if (snap > 0 && this.grabPoint && this.tool !== 'range-select') {
                    this.grabPoint = point;
                }
            }
        }


        this.updateCursor(defaultCursor);
        if (this.grabbing && this.grabTarget && isLeftPressed(domEvent)) {
            domEvent.preventDefault();
            domEvent.stopPropagation();
            const { point } = mouseEvent;
            switch (this.grabTarget) {
                case 'DIVIDER':
                    if (this.timeline.sidebar) {
                        this.timeline.sidebar.width = point.x;
                    }
                    break;
                case 'VIEWPORT':
                    switch (this.tool) {
                        case 'hand':
                            const dx = point.x - this.grabPoint!.x;
                            this.timeline.panBy(-dx, false);
                            this.grabPoint = point;
                            break;
                        case 'range-select':
                            const start = this.mouse2time(this.grabPoint!.x);
                            const stop = this.mouse2time(point.x);
                            this.timeline.setSelection(start, stop);
                            break;
                    }
                    break;
            }
        }
    }

    private initiateGrab() {
        document.addEventListener('click', clickBlocker, true /* capture ! */);
        document.addEventListener('mouseup', this.documentMouseUpListener);
        document.addEventListener('mousemove', this.documentMouseMoveListener);
        this.grabbing = true;
    }

    private onWheel(event: WheelEvent) {
        const bbox = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - bbox.left;
        const sidebarWidth = this.timeline.sidebar?.clippedWidth || 0;

        if (mouseX > sidebarWidth) {
            if (event.deltaX > 0) {
                this.timeline.panBy(50);
            } else if (event.deltaX < 0) {
                this.timeline.panBy(-50);
            }

            const relto = this.mouse2time(mouseX);
            if (event.deltaY > 0) {
                this.timeline.zoom(2, true, relto);
            } else if (event.deltaY < 0) {
                this.timeline.zoom(0.5, true, relto);
            }

            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }

    private onDocumentMouseUp(event: MouseEvent) {
        if (this.grabbing) {
            document.removeEventListener('mouseup', this.documentMouseUpListener);
            document.removeEventListener('mousemove', this.documentMouseMoveListener);
            this.grabbing = false;
            this.grabPoint = undefined;
            this.grabTarget = undefined;
            this.updateCursor();
        }
    }

    private onDocumentMouseMove(event: MouseEvent) {
        this.onCanvasMouseMove(event);
    }

    private mouse2time(mouseX: number) {
        const sidebarWidth = this.timeline.sidebar?.clippedWidth || 0;
        const viewportX = mouseX - sidebarWidth;
        const totalMillis = this.timeline.stop - this.timeline.start;
        const totalPixels = this.timeline.mainWidth;
        const offsetMillis = (viewportX / totalPixels) * totalMillis;
        return this.timeline.start + offsetMillis;
    }

    private maybeFireViewportMouseOut(event: MouseEvent) {
        if (this.isViewportHover) {
            const vpEvent: ViewportMouseOutEvent = {
                clientX: event.clientX,
                clientY: event.clientY,
            };
            this.timeline.fireEvent('viewportmouseout', vpEvent);
        }
    }

    private updateCursor(defaultCursor = 'default') {
        let newCursor = defaultCursor;
        if (this.grabTarget === 'DIVIDER' || this.isDividerHover) {
            newCursor = 'col-resize';
        } else if (this.grabbing && this.tool === 'range-select') {
            newCursor = 'col-resize';
        } else if (this.grabbing && this.tool === 'hand') {
            newCursor = 'grabbing';
        }

        if (newCursor != this.canvas.style.cursor) {
            this.canvas.style.cursor = newCursor;
        }
    }
}
