import { Line } from './Line';

export interface Event {
    start: number;
    stop: number;
    title?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    borderColor?: string;
    borders?: boolean | 'vertical';
    textAlign?: string;
    data?: any;
}

export class EventLine extends Line<Event[]> {

    drawContent(ctx: CanvasRenderingContext2D) {
        const events = this.data || [];
        for (const event of events) {
            const t1 = this.timenav.positionTime(event.start);
            const t2 = this.timenav.positionTime(event.stop);
            ctx.fillStyle = '#529bff';
            ctx.fillRect(this.x + t1, this.y, t2 - t1, this.height);
        }
    }
}
