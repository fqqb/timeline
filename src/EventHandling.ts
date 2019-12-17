import { Timenav } from './Timenav';

export class EventHandling {

    private isDown = false;
    private startX?: number;

    constructor(private timenav: Timenav, private canvas: HTMLCanvasElement) {
        canvas.addEventListener('click', e => this.onClick(e), false);
        canvas.addEventListener('mousedown', e => this.onMouseDown(e), false);
        canvas.addEventListener('mouseup', e => this.onMouseUp(e), false);
        canvas.addEventListener('mouseout', e => this.onMouseOut(e), false);
        canvas.addEventListener('mousemove', e => this.onMouseMove(e), false);
    }

    private onClick(event: MouseEvent) {
        console.log('a click');
    }

    private onMouseDown(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();

        // calc the starting mouse X,Y for the drag
        var bbox = this.canvas.getBoundingClientRect();
        this.startX = event.clientX - bbox.left;

        this.isDown = true;
    }

    private onMouseUp(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDown = false;
    }

    private onMouseOut(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.isDown = false;
    }

    private onMouseMove(event: MouseEvent) {
        var bbox = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - bbox.left;

        if (!this.isDown) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        console.log('got x', mouseX);
        // this.timenav.getSidebar().setWidth(mouseX);

        // dx & dy are the distance the mouse has moved since
        // the last mousemove event
        const dx = mouseX - this.startX!;
        this.timenav.panBy(-dx, false);

        // reset the vars for next mousemove
        this.startX = mouseX;
    }
}
