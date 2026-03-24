import { GrabHitEvent } from '../../graphics/GrabHitEvent';
import { HitRegionSpecification } from '../../graphics/HitRegionSpecification';
import { MouseHitEvent } from '../../graphics/MouseHitEvent';
import { WheelHitEvent } from '../../graphics/WheelHitEvent';
import { LinePlot } from './LinePlot';

export class AxisRegion implements HitRegionSpecification {
    id: string;
    parent: string;
    cursor = 'row-resize';

    private startPosition?: number;
    private startValue?: number;
    private originalMin?: number;
    private originalMax?: number;

    constructor(id: string, parent: string, private linePlot: LinePlot) {
        this.id = id;
        this.parent = parent;
    }

    mouseDown(mouseEvent: MouseHitEvent) {
        if (!this.linePlot.valueForPositionFn) {
            return;
        }

        const { linePlot } = this;
        this.startPosition = mouseEvent.y - linePlot.y;
        this.startValue = this.linePlot.valueForPositionFn(this.startPosition);
        this.originalMin = linePlot.visibleMinimum;
        this.originalMax = linePlot.visibleMaximum;
    }

    grab(grabEvent: GrabHitEvent) {
        const { zoomMultiplier } = this.linePlot;
        const grabPosition = grabEvent.y - this.linePlot.y;

        const delta = this.startPosition! - grabPosition;
        const min = this.originalMin!;
        const max = this.originalMax!;
        if (delta > 0) {
            const factor = 1 / (1 + Math.abs(delta * zoomMultiplier));
            this.zoom(factor, min, max, this.startValue!);
        } else if (delta < 0) {
            const factor = 1 + Math.abs(delta * zoomMultiplier);
            this.zoom(factor, min, max, this.startValue!);
        } else {
            this.zoom(1, min, max, this.startValue!); // Reset zoom
        }
    }

    grabEnd() {
        this.startPosition = undefined;
        this.startValue = undefined;
        this.originalMin = undefined;
        this.originalMax = undefined;
    }

    wheel(wheelEvent: WheelHitEvent) {
        if (!this.linePlot.valueForPositionFn) {
            return;
        }

        const { linePlot } = this;
        const min = linePlot.visibleMinimum;
        const max = linePlot.visibleMaximum;
        const relto = this.linePlot.valueForPositionFn(wheelEvent.y - linePlot.y);

        if (wheelEvent.deltaY > 0) {
            this.zoom(2, min, max, relto);
        } else if (wheelEvent.deltaY < 0) {
            this.zoom(0.5, min, max, relto);
        }
    }

    doubleClick() {
        this.linePlot.resetAxisRange();
    }

    /**
     * Zoom by a factor relative to the original range (at grab start).
     *
     * 2 means twice the axis range
     * 0.5 means half the axis range
     */
    private zoom(factor: number, min: number, max: number, relto: number) {
        const reltoRatio = (relto - min) / (max - min);
        const prevRange = max - min;
        const nextRange = prevRange * factor;

        const newMin = relto - reltoRatio * nextRange;
        const newMax = relto + (1 - reltoRatio) * nextRange;
        this.linePlot.setAxisRange(newMin, newMax);
    }
}
