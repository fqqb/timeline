import { Graphics } from '../../graphics/Graphics';
import { Path } from '../../graphics/Path';
import { AnnotatedItem } from './AnnotatedItem';
import { Connection } from './Connection';
import { ConnectionRenderer } from './ConnectionRenderer';
import { ItemBand } from './ItemBand';

export class DefaultConnectionRenderer implements ConnectionRenderer {

    private itemById = new Map<string | number, AnnotatedItem>();
    private offsetYById = new Map<string | number, number>();

    beforeConnectionDraw(band: ItemBand, lines: AnnotatedItem[][]) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const offsetY = i * (band.lineSpacing + band.itemHeight);
            for (const item of line) {
                if (item.id) {
                    this.itemById.set(item.id, item);
                    this.offsetYById.set(item.id, offsetY);
                }
            }
        }
    }

    draw(g: Graphics, band: ItemBand, connection: Connection): void {
        const from = this.itemById.get(connection.from);
        const to = this.itemById.get(connection.to);
        if (!from?.drawInfo || !to?.drawInfo) {
            return;
        }

        if (connection.type === 'FINISH_TO_START') {
            this.drawFinishToStart(g, band, connection, from, to);
        } else if (connection.type === 'START_TO_START') {
            this.drawStartToStart(g, band, connection, from, to);
        } else if (connection.type === 'FINISH_TO_FINISH') {
            this.drawFinishToFinish(g, band, connection, from, to);
        } else if (connection.type === 'START_TO_FINISH') {
            this.drawStartToFinish(g, band, connection, from, to);
        }
    }

    private drawStartToStart(g: Graphics, band: ItemBand, connection: Connection, from: AnnotatedItem, to: AnnotatedItem) {
        const lineColor = connection.lineColor ?? band.connectionLineColor;
        const lineWidth = connection.lineWidth ?? band.connectionLineWidth;

        // "from" point
        const x1 = from.drawInfo!.startX;
        const y1 = this.offsetYById.get(connection.from)! + (band.itemHeight / 2);

        // "to" point
        let x2 = to!.drawInfo!.startX;
        let y2 = this.offsetYById.get(connection.to)! + (band.itemHeight / 2);

        let px1 = Math.round(x1);
        let py1 = Math.round(y1);
        let px2 = Math.round(x2);
        let py2 = Math.round(y2);
        if (lineWidth % 2 !== 0) {
            px1 += 0.5; py1 += 0.5; px2 += 0.5; py2 += 0.5;
        }

        const offset = band.itemHeight / 2; // How far the line "steps out" to the left
        const radius = band.connectionJointRadius;
        const minX = Math.min(px1, px2) - offset;

        const path = new Path(px1, py1);

        if (Math.abs(py1 - py2) < 1) {
            path.lineTo(px2, py2);
        } else {
            // 1. Move left to the first corner
            path.lineTo(minX + radius, py1);
            // 2. Curve down towards the vertical line
            path.arcTo(minX, py1, minX, py1 + (py2 > py1 ? radius : -radius), radius);
            // 3. Line down to the second corner
            path.lineTo(minX, py2 - (py2 > py1 ? radius : -radius));
            // 4. Curve back right towards the target
            path.arcTo(minX, py2, minX + radius, py2, radius);
            // 5. Final line to target
            path.lineTo(px2, py2);
        }

        g.strokePath({
            color: lineColor,
            path: path,
            lineWidth,
            lineJoin: 'round',
        });
    }

    private drawFinishToStart(g: Graphics, band: ItemBand, connection: Connection, from: AnnotatedItem, to: AnnotatedItem) {
        const lineColor = connection.lineColor ?? band.connectionLineColor;
        const lineWidth = connection.lineWidth ?? band.connectionLineWidth;

        // "from" point
        const x1 = from.drawInfo!.stopX;
        const y1 = this.offsetYById.get(connection.from)! + (band.itemHeight / 2);

        // "to" point
        const x2 = to!.drawInfo!.startX;
        const y2 = this.offsetYById.get(connection.to)! + (band.itemHeight / 2);

        let px1 = Math.round(x1);
        let py1 = Math.round(y1);
        let px2 = Math.round(x2);
        let py2 = Math.round(y2);
        if (lineWidth % 2 !== 0) {
            px1 += 0.5; py1 += 0.5; px2 += 0.5; py2 += 0.5;
        }

        const radius = band.connectionJointRadius;
        const path = new Path(px1, py1);

        if (Math.abs(py1 - py2) < 1) {
            path.lineTo(px2, py2);
        } else {
            const verticalDir = py2 > py1 ? 1 : -1;

            // Scenario A: B starts AFTER A ends (Simple S-curve)
            if (px2 >= px1 + (radius * 2)) {
                const midX = px1 + (px2 - px1) / 2;
                path.lineTo(midX - radius, py1);
                path.arcTo(midX, py1, midX, py1 + (radius * verticalDir), radius);
                path.lineTo(midX, py2 - (radius * verticalDir));
                path.arcTo(midX, py2, midX + radius, py2, radius);
            }
            // Scenario B: B starts BEFORE A ends (Overlap - the "Loop Around")
            else {
                const outOffset = band.itemHeight / 2; // How far to step out to the right of A
                const rightX = px1 + outOffset;
                const midY = py1 + (py2 - py1) / 2;
                const leftX = px2 - outOffset;

                path.lineTo(rightX - radius, py1);
                // Curve 1: Turn Down
                path.arcTo(rightX, py1, rightX, py1 + (radius * verticalDir), radius);
                // Line 2: Down to halfway Y
                path.lineTo(rightX, midY - (radius * verticalDir));
                // Curve 3: Turn Left
                path.arcTo(rightX, midY, rightX - radius, midY, radius);
                // Line 4: Move left past the start of B
                path.lineTo(leftX + radius, midY);
                // Curve 5: Turn Down
                path.arcTo(leftX, midY, leftX, midY + (radius * verticalDir), radius);
                // Line 6: Down to target Y
                path.lineTo(leftX, py2 - (radius * verticalDir));
                // Curve 7: Turn Right
                path.arcTo(leftX, py2, leftX + radius, py2, radius);
            }

            path.lineTo(px2, py2);
        }

        g.strokePath({ color: lineColor, path: path, lineWidth, lineJoin: 'round' });
    }

    private drawFinishToFinish(g: Graphics, band: ItemBand, connection: Connection, from: AnnotatedItem, to: AnnotatedItem) {
        const lineColor = connection.lineColor ?? band.connectionLineColor;
        const lineWidth = connection.lineWidth ?? band.connectionLineWidth;

        // "from" point
        const x1 = from.drawInfo!.stopX;
        const y1 = this.offsetYById.get(connection.from)! + (band.itemHeight / 2);

        // "to" point
        const x2 = to!.drawInfo!.stopX;
        const y2 = this.offsetYById.get(connection.to)! + (band.itemHeight / 2);

        let px1 = Math.round(x1);
        let py1 = Math.round(y1);
        let px2 = Math.round(x2);
        let py2 = Math.round(y2);

        if (lineWidth % 2 !== 0) {
            px1 += 0.5; py1 += 0.5; px2 += 0.5; py2 += 0.5;
        }

        const radius = band.connectionJointRadius;
        const outOffset = band.itemHeight / 2;
        const maxX = Math.max(px1, px2) + outOffset;
        const verticalDir = py2 > py1 ? 1 : -1;
        const path = new Path(px1, py1);

        if (Math.abs(py1 - py2) < 1) {
            path.lineTo(px2, py2);
        } else {
            // Step out right from A
            path.lineTo(maxX - radius, py1);
            path.arcTo(maxX, py1, maxX, py1 + (radius * verticalDir), radius);
            // Vertical drop to B's level
            path.lineTo(maxX, py2 - (radius * verticalDir));
            // Curve back left into the end of B
            path.arcTo(maxX, py2, maxX - radius, py2, radius);
            path.lineTo(px2, py2);
        }

        g.strokePath({ color: lineColor, path, lineWidth, lineJoin: 'round' });
    }

    private drawStartToFinish(g: Graphics, band: ItemBand, connection: Connection, from: AnnotatedItem, to: AnnotatedItem) {
        const lineColor = connection.lineColor ?? band.connectionLineColor;
        const lineWidth = connection.lineWidth ?? band.connectionLineWidth;

        // "from" point
        const x1 = from.drawInfo!.startX;
        const y1 = this.offsetYById.get(connection.from)! + (band.itemHeight / 2);

        // "to" point
        const x2 = to!.drawInfo!.stopX;
        const y2 = this.offsetYById.get(connection.to)! + (band.itemHeight / 2);

        let px1 = Math.round(x1);
        let py1 = Math.round(y1);
        let px2 = Math.round(x2);
        let py2 = Math.round(y2);
        if (lineWidth % 2 !== 0) {
            px1 += 0.5; py1 += 0.5; px2 += 0.5; py2 += 0.5;
        }

        const radius = band.connectionJointRadius;
        const outOffset = band.itemHeight / 2;
        const path = new Path(px1, py1);
        const verticalDir = py2 > py1 ? 1 : -1;

        if (Math.abs(py1 - py2) < 1) {
            path.lineTo(px2, py2);
        } else {
            // Scenario: Gap (B ends comfortably before A starts)
            if (px2 <= px1 - (radius * 2)) {
                const midX = px2 + (px1 - px2) / 2;
                path.lineTo(midX + radius, py1);
                path.arcTo(midX, py1, midX, py1 + (radius * verticalDir), radius);
                path.lineTo(midX, py2 - (radius * verticalDir));
                path.arcTo(midX, py2, midX - radius, py2, radius);
            }
            // Scenario: Overlap (B ends after A has already started)
            else {
                const leftX = px1 - outOffset;
                const rightX = px2 + outOffset;
                const midY = py1 + (py2 - py1) / 2;

                path.lineTo(leftX + radius, py1);
                path.arcTo(leftX, py1, leftX, py1 + (radius * verticalDir), radius);
                path.lineTo(leftX, midY - (radius * verticalDir));
                path.arcTo(leftX, midY, leftX + radius, midY, radius);
                path.lineTo(rightX - radius, midY);
                path.arcTo(rightX, midY, rightX, midY + (radius * verticalDir), radius);
                path.lineTo(rightX, py2 - (radius * verticalDir));
                path.arcTo(rightX, py2, rightX - radius, py2, radius);
            }
            path.lineTo(px2, py2);
        }

        g.strokePath({ color: lineColor, path, lineWidth, lineJoin: 'round' });
    }
}
