import { Decoration } from './Decoration';
import { Timeline } from './Timeline';

export class TimeLocator extends Decoration {

    private knobColor = 'red';
    private knobRadius = 3;

    private lineColor = 'red';
    private lineWidth = 1;
    private lineOpacity = 0.6;
    private lineDash = [4, 3];

    private shadePast = false;
    private shadePastColor = 'grey';
    private shadePastOpacity = 0.4;

    private shadeFuture = false;
    private shadeFutureColor = 'grey';
    private shadeFutureOpacity = 0.4;

    constructor(private timeline: Timeline, private timeProvider: () => Date) {
        super();
    }

    draw(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d')!;

        const t = this.timeProvider();
        const x = this.timeline.positionDate(t);

        if (this.shadePast) {
            ctx.globalAlpha = this.shadePastOpacity;
            ctx.fillStyle = this.shadePastColor;
            ctx.fillRect(0, 0, x, canvas.height);
            ctx.globalAlpha = 1;
        }

        if (this.shadeFuture) {
            ctx.globalAlpha = this.shadeFutureOpacity;
            ctx.fillStyle = this.shadeFutureColor;
            ctx.fillRect(x, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;
        }

        ctx.strokeStyle = this.lineColor;
        ctx.globalAlpha = this.lineOpacity;
        ctx.lineWidth = this.lineWidth;
        ctx.setLineDash(this.lineDash);
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x + 0.5, 0, this.knobRadius, 0, 2 * Math.PI);
        ctx.fillStyle = this.knobColor;
        ctx.fill();
    }
}
