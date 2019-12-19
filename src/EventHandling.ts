import { ViewportMouseMoveEvent, ViewportMouseOutEvent } from './events';
import { Timenav } from './Timenav';

export class EventHandling {

    private isDown = false;
    private startX?: number;
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
        this.startX = event.clientX - bbox.left;

        this.isDown = true;
    }

    private onCanvasMouseUp(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDown = false;
    }

    private onCanvasMouseOut(event: MouseEvent) {
        this.maybeFireViewportMouseOut(event);
        this.isViewportHover = false;

        event.preventDefault();
        event.stopPropagation();
        this.isDown = false;
    }

    private onCanvasMouseMove(event: MouseEvent) {
        var bbox = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - bbox.left;
        const sidebarWidth = this.timenav.sidebar?.clippedWidth || 0;

        const overSidebar = mouseX <= sidebarWidth;
        const overViewport = sidebarWidth < mouseX && mouseX <= this.timenav.width;

        if (!overViewport) {
            this.maybeFireViewportMouseOut(event);
        }
        this.isViewportHover = overViewport;

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

        if (!this.isDown) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        // console.log('got x', mouseX);
        // this.timenav.getSidebar().setWidth(mouseX);

        // dx & dy are the distance the mouse has moved since
        // the last mousemove event
        const dx = mouseX - this.startX!;
        this.timenav.panBy(-dx, false);

        // reset the vars for next mousemove
        this.startX = mouseX;
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
}
