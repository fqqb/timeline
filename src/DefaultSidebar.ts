import { HeaderClickEvent } from './events';
import { Graphics, Path } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Line } from './Line';
import { Sidebar } from './Sidebar';

export class DefaultSidebar extends Sidebar {

    private _dividerColor = '#b3b3b3';
    private _foregroundColor = '#333';
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;

    private hoveredIndex?: number;

    /** @hidden */
    drawContent(g: Graphics) {
        const offscreen = g.createChild(this.width, g.canvas.height);
        this.drawOffscreen(offscreen);
        g.copy(offscreen, 0, 0);
    }

    private drawOffscreen(g: Graphics) {
        g.fillRect({
            x: 0,
            y: 0,
            width: this.clippedWidth,
            height: g.canvas.height,
            color: this.timeline.backgroundOddColor,
        });

        const lines = this.timeline.getLines().filter(l => l.frozen)
            .concat(this.timeline.getLines().filter(l => !l.frozen));

        let stripedColor = this.timeline.backgroundOddColor;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const backgroundColor = line.backgroundColor || stripedColor;
            this.drawLine(g, line, backgroundColor, i);
            stripedColor = (stripedColor === this.timeline.backgroundOddColor)
                ? this.timeline.backgroundEvenColor
                : this.timeline.backgroundOddColor;
        }

        g.fillRect({
            x: 0,
            y: 0,
            width: this.clippedWidth,
            height: g.canvas.height,
            color: '#eee',
            opacity: 0.2,
        });

        for (const line of lines) {
            if (line.label) {
                g.fillText({
                    x: 5,
                    y: line.y + (line.height / 2),
                    align: 'left',
                    baseline: 'middle',
                    color: this.foregroundColor,
                    font: `${this.textSize}px ${this.fontFamily}`,
                    text: line.label,
                });
            }
        }

        // Right vertical divider
        const dividerX = this.clippedWidth - 0.5;
        g.strokePath({
            color: this.dividerColor,
            path: new Path(dividerX, 0).lineTo(dividerX, g.canvas.height),
        });
    }

    private drawLine(g: Graphics, line: Line, backgroundColor: string, idx: number) {
        g.fillRect({
            x: 0,
            y: line.y,
            width: this.width,
            height: line.height,
            color: backgroundColor,
        });

        if (this.hoveredIndex === idx) {
            g.fillRect({
                x: 0,
                y: line.y,
                width: this.width,
                height: line.height,
                color: '#aaa',
                opacity: 0.3,
            });
        }

        const hitRegionSpec: HitRegionSpecification = {
            id: `line-${idx}-header`,
            cursor: 'pointer',
            mouseEnter: () => {
                this.hoveredIndex = idx;
                this.reportMutation();
            },
            mouseOut: () => {
                this.hoveredIndex = undefined;
                this.reportMutation();
            },
            click: () => {
                const clickEvent: HeaderClickEvent = { line };
                this.timeline.fireEvent('headerclick', clickEvent);
            },
        };
        const hitRegion = g.addHitRegion(hitRegionSpec);
        hitRegion.addRect(0, line.y, this.width, line.height);

        // Bottom horizontal divider
        const dividerY = line.y + line.height + 0.5;
        g.strokePath({
            color: this.timeline.rowBorderColor,
            path: new Path(0, dividerY).lineTo(this.clippedWidth, dividerY),
            lineWidth: this.timeline.rowBorderLineWidth,
        });
    }

    get foregroundColor() { return this._foregroundColor; }
    set foregroundColor(foregroundColor: string) {
        this._foregroundColor = foregroundColor;
        this.reportMutation();
    }

    get dividerColor() { return this._dividerColor; }
    set dividerColor(dividerColor: string) {
        this._dividerColor = dividerColor;
        this.reportMutation();
    }

    get fontFamily() { return this._fontFamily; }
    set fontFamily(fontFamily: string) {
        this._fontFamily = fontFamily;
        this.reportMutation();
    }

    get textSize() { return this._textSize; }
    set textSize(textSize: number) {
        this._textSize = textSize;
        this.reportMutation();
    }
}
