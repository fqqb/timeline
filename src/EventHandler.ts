import { ViewportMouseMoveEvent, ViewportMouseOutEvent } from './events';
import { Timenav } from './Timenav';

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

export class EventHandler {

    private defaultGrabAction?: 'PAN' | 'SELECT' = 'SELECT';

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

    constructor(private timenav: Timenav, private canvas: HTMLCanvasElement) {
        canvas.addEventListener('click', e => this.onCanvasClick(e), false);
        canvas.addEventListener('mousedown', e => this.onCanvasMouseDown(e), false);
        canvas.addEventListener('mouseout', e => this.onCanvasMouseOut(e), false);
        canvas.addEventListener('mousemove', e => this.onCanvasMouseMove(e), false);
    }

    private onCanvasClick(event: MouseEvent) {
        console.log('a click');
        this.timenav.clearSelection();
    }

    private onCanvasMouseDown(event: MouseEvent) {
        document.removeEventListener('click', clickBlocker, true /* Must be same as when created */);

        if (isLeftPressed(event)) {
            const sidebarWidth = this.timenav.sidebar?.clippedWidth || 0;
            const bbox = this.canvas.getBoundingClientRect();
            const mouseX = event.clientX - bbox.left;
            const mouseY = event.clientY - bbox.top;

            if (this.timenav.sidebar && sidebarWidth - 5 < mouseX && mouseX <= sidebarWidth + 5) {
                this.grabTarget = 'DIVIDER';
                this.grabPoint = { x: mouseX, y: mouseY };
                this.grabbing = true; // No snap detection for this

                event.preventDefault();
                event.stopPropagation();
                return false;
            } else if (this.defaultGrabAction) {
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
        // this.grabTarget = undefined;
    }

    private onCanvasMouseMove(event: MouseEvent) {
        var bbox = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - bbox.left;
        const mouseY = event.clientY - bbox.top;
        const sidebarWidth = this.timenav.sidebar?.clippedWidth || 0;

        let overSidebar;
        let overDivider;
        let overViewport;
        if (this.timenav.sidebar) {
            overSidebar = mouseX <= sidebarWidth - 5;
            overDivider = !overSidebar && mouseX <= sidebarWidth + 5;
            overViewport = !overSidebar && !overDivider;
        } else {
            overSidebar = false;
            overDivider = false;
            overViewport = true;
        }

        if (!overViewport) {
            this.maybeFireViewportMouseOut(event);
        }
        this.isViewportHover = overViewport;
        this.isDividerHover = overDivider;

        if (overViewport) {
            const vpEvent: ViewportMouseMoveEvent = {
                clientX: event.clientX,
                clientY: event.clientY,
                viewportX: mouseX - sidebarWidth,
                viewportY: event.clientY - bbox.top,
                time: this.mouse2time(mouseX),
            };
            this.timenav.fireEvent('viewportmousemove', vpEvent);
        }

        if (this.grabPoint && !this.grabbing && isLeftPressed(event)) {
            const distance = measureDistance(this.grabPoint.x, this.grabPoint.y, mouseX, mouseY);
            if (Math.abs(distance) > snap) {
                document.addEventListener('click', clickBlocker, true /* capture ! */);
                document.addEventListener('mouseup', this.documentMouseUpListener);
                document.addEventListener('mousemove', this.documentMouseMoveListener);
                this.grabbing = true;
                // Prevent stutter on first move
                if (snap > 0 && this.grabPoint && this.defaultGrabAction !== 'SELECT') {
                    this.grabPoint = { x: mouseX, y: mouseY };
                }
            }
        }


        this.updateCursor();
        if (this.grabbing && this.grabTarget && isLeftPressed(event)) {
            event.preventDefault();
            event.stopPropagation();
            switch (this.grabTarget) {
                case 'DIVIDER':
                    if (this.timenav.sidebar) {
                        this.timenav.sidebar.width = mouseX;
                    }
                    break;
                case 'VIEWPORT':
                    switch (this.defaultGrabAction) {
                        case 'PAN':
                            const dx = mouseX - this.grabPoint!.x;
                            this.timenav.panBy(-dx, false);
                            this.grabPoint = { x: mouseX, y: mouseY };
                            break;
                        case 'SELECT':
                            const start = this.mouse2time(this.grabPoint!.x);
                            const stop = this.mouse2time(mouseX);
                            this.timenav.setSelection(start, stop);
                            break;
                    }
                    break;
            }
        }
    }

    private onDocumentMouseUp(event: MouseEvent) {
        if (this.grabbing) {
            document.removeEventListener('mouseup', this.documentMouseUpListener);
            document.removeEventListener('mousemove', this.documentMouseMoveListener);
            this.grabbing = false;
            this.grabPoint = undefined;
            this.grabTarget = undefined;
        }
    }

    private onDocumentMouseMove(event: MouseEvent) {
        this.onCanvasMouseMove(event);
    }

    private mouse2time(mouseX: number) {
        const sidebarWidth = this.timenav.sidebar?.clippedWidth || 0;
        const viewportX = mouseX - sidebarWidth;
        const totalMillis = this.timenav.stop - this.timenav.start;
        const totalPixels = this.timenav.mainWidth;
        const offsetMillis = (viewportX / totalPixels) * totalMillis;
        return this.timenav.start + offsetMillis;
    }

    private maybeFireViewportMouseOut(event: MouseEvent) {
        if (this.isViewportHover) {
            const vpEvent: ViewportMouseOutEvent = {
                clientX: event.clientX,
                clientY: event.clientY,
            };
            this.timenav.fireEvent('viewportmouseout', vpEvent);
        }
    }

    private updateCursor() {
        let newCursor = 'default';
        if (this.grabTarget === 'DIVIDER' || this.isDividerHover) {
            newCursor = 'col-resize';
        } else if (this.grabbing && this.defaultGrabAction === 'SELECT') {
            newCursor = 'col-resize';
        } else if (this.grabbing && this.defaultGrabAction === 'PAN') {
            newCursor = 'grabbing';
        }

        if (newCursor != this.canvas.style.cursor) {
            this.canvas.style.cursor = newCursor;
        }
    }
}
