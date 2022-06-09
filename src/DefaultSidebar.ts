import { Band } from './Band';
import { Graphics, Path } from './Graphics';
import { HitRegionSpecification } from './HitCanvas';
import { Sidebar } from './Sidebar';

export class DefaultSidebar extends Sidebar {

    private _dividerColor = '#b3b3b3';
    private _foregroundColor = '#333333';
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;
    private _overlayColor = '#eeeeee';
    private _overlayOpacity = 0.2;
    private _hoverOverlayColor = '#aaaaaa';
    private _hoverOverlayOpacity = 0.3;

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

        const bands = this.timeline.getBands().filter(l => l.frozen)
            .concat(this.timeline.getBands().filter(l => !l.frozen));

        let stripedColor = this.timeline.backgroundOddColor;
        for (let i = 0; i < bands.length; i++) {
            const band = bands[i];
            const backgroundColor = band.backgroundColor || stripedColor;
            this.drawBand(g, band, backgroundColor, i);
            stripedColor = (stripedColor === this.timeline.backgroundOddColor)
                ? this.timeline.backgroundEvenColor
                : this.timeline.backgroundOddColor;
        }

        g.fillRect({
            x: 0,
            y: 0,
            width: this.clippedWidth,
            height: g.canvas.height,
            color: this.overlayColor,
            opacity: this.overlayOpacity,
        });

        for (const band of bands) {
            if (band.label) {
                const contentHeight = band.height - band.marginTop - band.marginBottom;
                g.fillText({
                    x: 5,
                    y: band.y + band.marginTop + (contentHeight / 2),
                    align: 'left',
                    baseline: 'middle',
                    color: this.foregroundColor,
                    font: `${this.textSize}px ${this.fontFamily}`,
                    text: band.label,
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

    private drawBand(g: Graphics, band: Band, backgroundColor: string, idx: number) {
        g.fillRect({
            x: 0,
            y: band.y,
            width: this.width,
            height: band.height,
            color: backgroundColor,
        });

        if (this.hoveredIndex === idx) {
            g.fillRect({
                x: 0,
                y: band.y,
                width: this.width,
                height: band.height,
                color: this.hoverOverlayColor,
                opacity: this.hoverOverlayOpacity,
            });
        }

        const hitRegionSpec: HitRegionSpecification = {
            id: `band-${idx}-header`,
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
                this.timeline.fireEvent('headerclick', { band });
            },
        };
        const hitRegion = g.addHitRegion(hitRegionSpec);
        hitRegion.addRect(0, band.y, this.width, band.height);

        // Bottom horizontal divider
        const borderWidth = band.borderWidth ?? this.timeline.bandBorderWidth;
        if (borderWidth) {
            const dividerY = band.y + band.height + (borderWidth / 2);
            g.strokePath({
                color: band.borderColor || this.timeline.bandBorderColor,
                lineWidth: borderWidth,
                path: new Path(0, dividerY).lineTo(this.clippedWidth, dividerY),
            });
        }
    }

    get foregroundColor() { return this._foregroundColor; }
    set foregroundColor(foregroundColor: string) {
        this._foregroundColor = foregroundColor;
        this.reportMutation();
    }

    /**
     * Color of the right border that separates
     * the sidebar from the timeline content.
     */
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

    /**
     * Color used to cover the background.
     *
     * This is intended to be used in combination with
     * <code>overlayOpacity</code> so that the overlay
     * does not hide any labels.
     */
    get overlayColor() { return this._overlayColor; }
    set overlayColor(overlayColor: string) {
        this._overlayColor = overlayColor;
        this.reportMutation();
    }

    /**
     * Opacity of the overlay.
     *
     * Set to 0 to effectively disable the overlay.
     */
    get overlayOpacity() { return this._overlayOpacity; }
    set overlayOpacity(overlayOpacity: number) {
        this._overlayOpacity = overlayOpacity;
        this.reportMutation();
    }

    /**
     * Color overlayed on top of the hovered label.
     *
     * This is intended to be used in combination with
     * <code>hoverOverlayOpacity</code> so that the
     * overlay does not hide any labels.
     */
    get hoverOverlayColor() { return this._hoverOverlayColor; }
    set hoverOverlayColor(hoverOverlayColor: string) {
        this._hoverOverlayColor = hoverOverlayColor;
        this.reportMutation();
    }

    /**
     * Opacity of the overlay when a label is hovered.
     *
     * Set to 0 to effectively disable hover overlay.
     */
    get hoverOverlayOpacity() { return this._hoverOverlayOpacity; }
    set hoverOverlayOpacity(hoverOverlayOpacity: number) {
        this._hoverOverlayOpacity = hoverOverlayOpacity;
        this.reportMutation();
    }
}
