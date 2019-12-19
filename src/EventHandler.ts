import { ViewportMouseMoveEvent, ViewportMouseOutEvent } from './events';
import { Timenav } from './Timenav';

export class EventHandler {

    private grabTarget?: 'DIVIDER' | 'VIEWPORT';
    private grabMouseX?: number;

    private isDividerHover = false;
    private isViewportHover = false;

    constructor(private timenav: Timenav, private canvas: HTMLCanvasElement) {
        canvas.addEventListener('click', e => this.onCanvasClick(e), false);
        canvas.addEventListener('mousedown', e => this.onCanvasMouseDown(e), false);
        canvas.addEventListener('mouseup', e => this.onCanvasMouseUp(e), false);
        canvas.addEventListener('mouseout', e => this.onCanvasMouseOut(e), false);
        canvas.addEventListener('mousemove', e => this.onCanvasMouseMove(e), false);
    }

    private onCanvasClick(event: MouseEvent) {
        console.log('a click');
    }

    private onCanvasMouseDown(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        // calc the starting mouse X,Y for the drag
        var bbox = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - bbox.left;

        if (this.timenav.sidebar) {
            const sidebarWidth = this.timenav.sidebar.clippedWidth;
            if (sidebarWidth - 5 < mouseX && mouseX <= sidebarWidth + 5) {
                this.grabTarget = 'DIVIDER';
                this.grabMouseX = mouseX;
                return;
            }
        }

        this.grabTarget = 'VIEWPORT';
        this.grabMouseX = mouseX;
    }

    private onCanvasMouseUp(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.grabTarget = undefined;
    }

    private onCanvasMouseOut(event: MouseEvent) {
        this.maybeFireViewportMouseOut(event);
        this.isViewportHover = false;

        event.preventDefault();
        event.stopPropagation();
        this.grabTarget = undefined;
    }

    private onCanvasMouseMove(event: MouseEvent) {
        var bbox = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - bbox.left;
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
            const viewportX = mouseX - sidebarWidth;
            const totalMillis = this.timenav.stop - this.timenav.start;
            const totalPixels = this.timenav.mainWidth;
            const offsetMillis = (viewportX / totalPixels) * totalMillis;

            const vpEvent: ViewportMouseMoveEvent = {
                clientX: event.clientX,
                clientY: event.clientY,
                viewportX,
                viewportY: event.clientY - bbox.top,
                time: this.timenav.start + offsetMillis,
            };
            this.timenav.fireEvent('viewportmousemove', vpEvent);
        }

        this.updateCursor();

        if (this.grabTarget) {
            event.preventDefault();
            event.stopPropagation();
            switch (this.grabTarget) {
                case 'DIVIDER':
                    if (this.timenav.sidebar) {
                        this.timenav.sidebar.width = mouseX;
                    }
                    break;
                case 'VIEWPORT':
                    // dx & dy are the distance the mouse has moved since
                    // the last mousemove event
                    const dx = mouseX - this.grabMouseX!;
                    this.timenav.panBy(-dx, false);
                    break;
            }

            // reset the vars for next mousemove
            this.grabMouseX = mouseX;
        }
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
        }

        if (newCursor != this.canvas.style.cursor) {
            this.canvas.style.cursor = newCursor;
        }
    }
}
