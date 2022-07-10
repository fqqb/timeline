import { Graphics } from '../graphics/Graphics';
import { HitRegionSpecification } from '../graphics/HitRegionSpecification';
import { Path } from '../graphics/Path';
import { Band } from './Band';
import { Sidebar } from './Sidebar';

/**
 * Default sidebar implementation.
 */
export class DefaultSidebar extends Sidebar {

    private _dividerColor = '#e3e3e3';
    private _foregroundColor = '#333333';
    private _fontFamily = 'Verdana, Geneva, sans-serif';
    private _textSize = 10;
    private _overlayColor = 'transparent';
    private _hoverOverlayColor = 'rgba(170, 170, 170, 0.3)';

    private hoveredIndex?: number;

    drawContent(g: Graphics) {
        if (this.clippedWidth) {
            const offscreen = g.createChild(this.clippedWidth, g.canvas.height);
            this.drawOffscreen(offscreen);
            g.copy(offscreen, 0, 0);
        }
    }

    private drawOffscreen(g: Graphics) {
        g.fillRect({
            x: 0,
            y: 0,
            width: this.clippedWidth,
            height: g.canvas.height,
            fill: this.timeline.background,
        });

        const bands = this.timeline.getBands().filter(l => l.frozen)
            .concat(this.timeline.getBands().filter(l => !l.frozen));

        for (let i = 0; i < bands.length; i++) {
            const band = bands[i];
            this.drawBand(g, band, i);
        }

        g.fillRect({
            x: 0,
            y: 0,
            width: this.clippedWidth,
            height: g.canvas.height,
            fill: this.overlayColor,
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

    private drawBand(g: Graphics, band: Band, idx: number) {
        // Default to following main band background, but allow overrides
        g.fillRect({
            x: 0,
            y: band.y,
            width: this.width,
            height: band.height,
            fill: band.background,
        });
        g.fillRect({
            x: 0,
            y: band.y,
            width: this.width,
            height: band.height,
            fill: band.headerBackground,
        });

        if (this.hoveredIndex === idx) {
            g.fillRect({
                x: 0,
                y: band.y,
                width: this.width,
                height: band.height,
                fill: this.hoverOverlayColor,
            });
        }

        if (band.headerClickListeners.length) {
            const hitRegionSpec: HitRegionSpecification = {
                id: `band-${idx}-header`,
                cursor: 'pointer',
                mouseEnter: () => {
                    this.hoveredIndex = idx;
                    this.reportMutation();
                },
                mouseLeave: () => {
                    this.hoveredIndex = undefined;
                    this.reportMutation();
                },
                click: () => {
                    band.headerClickListeners.forEach(listener => listener({ band }));
                },
            };

            const hitRegion = g.addHitRegion(hitRegionSpec);
            hitRegion.addRect(0, band.y, this.width, band.height);
        }

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
     * Color used to cover the background. This covers also the borders so
     * generally you want to add some level of transparency.
     */
    get overlayColor() { return this._overlayColor; }
    set overlayColor(overlayColor: string) {
        this._overlayColor = overlayColor;
        this.reportMutation();
    }

    /**
     * Color overlayed on top of the hovered label.
     */
    get hoverOverlayColor() { return this._hoverOverlayColor; }
    set hoverOverlayColor(hoverOverlayColor: string) {
        this._hoverOverlayColor = hoverOverlayColor;
        this.reportMutation();
    }
}
