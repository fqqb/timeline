import { Band } from './Band';
import { Graphics, Path } from './Graphics';
import { Line } from './Line';
import { Timeline } from './Timeline';

/**
 * Band type that plots a line along the timeline.
 */
export class LinePlot extends Band {

    private _lineColor = '#4f9146';
    private _fill = false;
    private _fillColor = '#9ee619';
    private _fillOpacity = 1;
    private _minimum?: number;
    private _maximum?: number;
    private _pointRadius = 1.5;
    private _pointColor = '#4f9146';
    private _lines: Line[] = [];
    private _contentHeight = 30;

    private processedPoints: Array<{ x: number, y: number | null; }> = [];
    private processedMinimum?: number;
    private processedMaximum?: number;

    constructor(timeline: Timeline) {
        super(timeline);
    }

    private processData() {
        this.processedPoints.length = 0;
        this.processedMinimum = this.minimum;
        this.processedMaximum = this.maximum;
        if (this.lines.length) {
            const line = this.lines[0];
            for (const [x, y] of line.points) {
                this.processedPoints.push({ x, y });
                if (this.minimum === undefined && y !== null) {
                    if (this.processedMinimum === undefined || y < this.processedMinimum) {
                        this.processedMinimum = y;
                    }
                }
                if (this.maximum === undefined && y !== null) {
                    if (this.processedMaximum === undefined || y > this.processedMaximum) {
                        this.processedMaximum = y;
                    }
                }
            }
            this.processedPoints.sort((a, b) => a.x - b.x);
        }
    }

    /** @hidden */
    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    /** @hidden */
    drawBandContent(g: Graphics) {
        if (!this.processedPoints.length) {
            return;
        }

        const line = this.lines[0];
        const points: Array<{ x: number, y: number | null; }> = [];
        const height = this.contentHeight;

        const fill = line.fill ?? this.fill;
        const fillColor = line.fillColor ?? this.fillColor;
        const fillOpacity = line.fillOpacity ?? this.fillOpacity;
        const lineColor = line.lineColor ?? this.lineColor;
        const pointRadius = line.pointRadius ?? this.pointRadius;

        const { processedMinimum: min, processedMaximum: max } = this;

        for (const sample of this.processedPoints) {
            const x = Math.round(this.timeline.positionTime(sample.x));
            if (sample.y === null) {
                points.push({ x, y: null });
            } else {
                const y = height - ((sample.y - min!) / (max! - min!) * (height - 0));
                points.push({ x, y });
            }
        }

        // Draw trace
        if (fill) {
            const originY = height - (0 - min! / (max! - min!) * (height - 0));
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const point = points[i];
                if (prev.y !== null && point.y !== null) {
                    g.fillPath({
                        path: new Path(prev.x, prev.y)
                            .lineTo(prev.x, originY)
                            .lineTo(point.x, originY)
                            .lineTo(point.x, point.y),
                        color: fillColor,
                        opacity: fillOpacity,
                    });
                }
            }
        }
        const path = new Path(points[0].x, points[0].y ?? 0);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const point = points[i];
            if (prev.y !== null && point.y !== null) {
                path.lineTo(point.x, point.y);
            } else if (point.y !== null) {
                path.moveTo(point.x, point.y);
            }
        }
        g.strokePath({
            path,
            color: this.lineColor,
            lineWidth: 1,
        });

        // Draw point symbols
        for (const point of points) {
            if (point.y !== null) {
                g.fillEllipse({
                    cx: point.x,
                    cy: point.y,
                    rx: pointRadius,
                    ry: pointRadius,
                    color: lineColor,
                });
            }
        }
    }

    /**
     * The height of the band content (excluding margins).
     */
    get contentHeight() { return this._contentHeight; }
    set contentHeight(contentHeight: number) {
        this._contentHeight = contentHeight;
        this.reportMutation();
    }

    /**
     * Color of the line that connects data points.
     */
    get lineColor() { return this._lineColor; }
    set lineColor(lineColor: string) {
        this.lineColor = lineColor;
        this.reportMutation();
    }

    /**
     * Whether to fill the area between the plot line and the value 0.
     */
    get fill() { return this._fill; }
    set fill(fill: boolean) {
        this._fill = fill;
        this.reportMutation();
    }

    /**
     * Color of the area between the plot line and the value 0.
     */
    get fillColor() { return this._fillColor; }
    set fillColor(fillColor: string) {
        this._fillColor = fillColor;
        this.reportMutation();
    }

    /**
     * Opacity of the area fill between the plot line and the value 0.
     */
    get fillOpacity() { return this._fillOpacity; }
    set fillOpacity(fillOpacity: number) {
        this._fillOpacity = fillOpacity;
        this.reportMutation();
    }

    /**
     * Color of the point symbol.
     */
    get pointColor() { return this._pointColor; }
    set pointColor(pointColor: string) {
        this._pointColor = pointColor;
        this.reportMutation();
    }

    /**
     * Radius of the point symbol.
     */
    get pointRadius() { return this._pointRadius; }
    set pointRadius(pointRadius: number) {
        this._pointRadius = pointRadius;
        this.reportMutation();
    }

    /**
     * Value that corresponds with the minimum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get minimum() { return this._minimum; }
    set minimum(minimum: number | undefined) {
        this._minimum = minimum;
        this.processData();
        this.reportMutation();
    }

    /**
     * Value that corresponds with the maximum value on the curve. If undefined,
     * the value is automatically derived from the plot data.
     */
    get maximum() { return this._maximum; }
    set maximum(maximum: number | undefined) {
        this._maximum = maximum;
        this.processData();
        this.reportMutation();
    }

    get lines() { return this._lines; }
    set lines(lines: Line[]) {
        this._lines = lines;
        this.processData();
        this.reportMutation();
    }
}
