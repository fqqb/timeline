import { Band } from './Band';
import { Graphics, Path } from './Graphics';
import { Line } from './Line';
import { Timeline } from './Timeline';

/**
 * Band type that plots a line along the timeline.
 */
export class LinePlot extends Band {

    private _lineColor = '#4f9146';
    private _lineWidth = 1;
    private _fillColor = 'transparent';
    private _labelFontFamily = 'Verdana, Geneva, sans-serif';
    private _labelTextColor = '#333333';
    private _labelTextSize = 8;
    private _minimum?: number;
    private _maximum?: number;
    private _pointRadius = 1.5;
    private _pointColor = '#4f9146';
    private _lines: Line[] = [];
    private _contentHeight = 30;
    private _labelFormatter: (value: number) => string = value => {
        return value.toFixed(2);
    };

    private processedLines: Array<{ x: number, y: number | null; }>[] = [];
    private processedMinimum?: number;
    private processedMaximum?: number;

    constructor(timeline: Timeline) {
        super(timeline);
    }

    private processData() {
        this.processedLines.length = 0;
        this.processedMinimum = this.minimum;
        this.processedMaximum = this.maximum;
        if (this.lines.length) {
            for (const line of this.lines) {
                const processedLine = [];
                for (const [x, y] of line.points) {
                    processedLine.push({ x, y });
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
                processedLine.sort((a, b) => a.x - b.x);
                this.processedLines.push(processedLine);
            }
        }
    }

    /** @hidden */
    calculateContentHeight(g: Graphics) {
        return this._contentHeight;
    }

    /** @hidden */
    drawBandContent(g: Graphics) {
        const { contentHeight } = this;
        const { processedMinimum: min, processedMaximum: max } = this;

        if (min !== undefined && max !== undefined) {
            for (let i = 0; i < this.lines.length; i++) {
                if (this.lines[i].points.size) {
                    const processedLine = this.processedLines[i];
                    this.drawLine(g, this.lines[i], processedLine, min, max);
                }
            }

            g.fillText({
                text: this.labelFormatter(min),
                align: 'right',
                baseline: 'bottom',
                color: this.labelTextColor,
                font: `${this.labelTextSize}px ${this.labelFontFamily}`,
                x: this.timeline.mainWidth,
                y: contentHeight,
            });
            g.fillText({
                text: this.labelFormatter(max),
                align: 'right',
                baseline: 'top',
                color: this.labelTextColor,
                font: `${this.labelTextSize}px ${this.labelFontFamily}`,
                x: this.timeline.mainWidth,
                y: 0,
            });
        }
    }

    private drawLine(g: Graphics, line: Line, processedLine: Array<{ x: number, y: number | null; }>, min: number, max: number) {
        const { contentHeight } = this;

        // Plot max should align with mid of top label, and plot min with mid of bottom label.
        // So we add a little whitespace to the actually available plot area.
        // (unrelated to any other band margins)
        const margin = this.labelTextSize / 2;
        const plotHeight = contentHeight - margin - margin;
        const positionValue = (value: number) => {
            return contentHeight - margin - ((value - min) / (max - min) * (plotHeight - 0));
        };

        const points: Array<{ x: number, y: number | null; }> = [];

        const fillColor = line.fillColor ?? this.fillColor;
        const lineColor = line.lineColor ?? this.lineColor;
        const lineWidth = line.lineWidth ?? this.lineWidth;
        const pointColor = line.pointColor ?? this.pointColor;
        const pointRadius = line.pointRadius ?? this.pointRadius;

        for (const sample of processedLine) {
            const x = Math.round(this.timeline.positionTime(sample.x));
            if (sample.y === null) {
                points.push({ x, y: null });
            } else {
                points.push({ x, y: positionValue(sample.y) });
            }
        }

        // Draw trace
        const path = new Path(points[0].x, points[0].y ?? 0);
        const originY = positionValue(0);
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const point = points[i];
            if (prev.y !== null && point.y !== null) {
                path.lineTo(point.x, point.y);

                // Area fill
                g.fillPath({
                    path: new Path(prev.x, prev.y)
                        .lineTo(prev.x, originY)
                        .lineTo(point.x, originY)
                        .lineTo(point.x, point.y),
                    color: fillColor,
                });
            } else if (point.y !== null) {
                path.moveTo(point.x, point.y);
            }
        }

        g.strokePath({
            path,
            color: lineColor,
            lineWidth,
        });

        // Draw point symbols
        for (const point of points) {
            if (point.y !== null) {
                g.fillEllipse({
                    cx: point.x,
                    cy: point.y,
                    rx: pointRadius,
                    ry: pointRadius,
                    color: pointColor,
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
     * Thickness of the plot line.
     */
    get lineWidth() { return this._lineWidth; }
    set lineWidth(lineWidth: number) {
        this.lineWidth = lineWidth;
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
     * Font family of any value labels.
     */
    get labelFontFamily() { return this._labelFontFamily; }
    set labelFontFamily(labelFontFamily: string) {
        this._labelFontFamily = labelFontFamily;
        this.reportMutation();
    }

    /**
     * Text color of any value labels.
     */
    get labelTextColor() { return this._labelTextColor; }
    set labelTextColor(labelTextColor: string) {
        this._labelTextColor = labelTextColor;
        this.reportMutation();
    }

    /**
     * Size of any value labels.
     */
    get labelTextSize() { return this._labelTextSize; }
    set labelTextSize(labelTextSize: number) {
        this._labelTextSize = labelTextSize;
        this.reportMutation();
    }

    /**
     * Function that formats a point value to string.
     *
     * The default behaviour is to format with 2 digits after the
     * decimal point.
     */
    get labelFormatter() { return this._labelFormatter; }
    set labelFormatter(labelFormatter: (value: number) => string) {
        this._labelFormatter = labelFormatter;
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
