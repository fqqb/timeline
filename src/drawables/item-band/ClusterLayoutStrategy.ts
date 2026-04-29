import { AnnotatedItem } from './AnnotatedItem';
import { Connection } from './Connection';
import { ItemBand } from './ItemBand';
import { ItemLayoutStrategy } from './ItemLayoutStrategy';

/**
 * Groups items in clusters based on interconnections.
 * Each cluster is then positioned so that there is no
 * overlap between the bounding box of each cluster.
 *
 * Finally, the clusters are decomposed to 'lines'.
 */
export class ClusterLayoutStrategy implements ItemLayoutStrategy {

    constructor(private itemBand: ItemBand) {
    }

    wrapItems(items: AnnotatedItem[]) {
        let clusters: Cluster[] = [];
        const clusterByItemId = new Map<string | number, Cluster>();

        // First pass, one cluster for each item
        for (const item of items) {
            const cluster = new Cluster(item);
            clusters.push(cluster);
            if (item.id !== undefined) {
                clusterByItemId.set(item.id, cluster);
            }
        }

        // Try to put the connection to a cluster for any of its ends.
        // If no match: don't care.
        for (const connection of this.itemBand.connections) {
            if (connection.from !== undefined) {
                const clusterFrom = clusterByItemId.get(connection.from);
                if (clusterFrom) {
                    clusterFrom.addConnection(connection);
                } else if (connection.to !== undefined) {
                    const clusterTo = clusterByItemId.get(connection.to);
                    clusterTo?.addConnection(connection);
                }
            }
        }

        // Merge interconnected clusters
        clusters = this.mergeClusters(clusters);
        this.sortClusters(clusters);

        const lines: AnnotatedItem[][] = [];

        const visited: Cluster[] = [];
        for (const cluster of clusters) {
            // 1. Find the first line index where this cluster's entire bounding box can fit.
            // It must be below any previous cluster that overlaps it in time.
            let clusterStartLine = 0;
            for (const prev of visited) {
                const timeOverlap = !(prev.stop <= cluster.start || prev.start >= cluster.stop);
                if (timeOverlap) {
                    // The bounding box rule: start after the previous cluster's total height ends
                    clusterStartLine = Math.max(clusterStartLine, prev.lineIndex + prev.height);
                }
            }
            cluster.lineIndex = clusterStartLine;

            // 2. Pack items within the cluster starting from 'clusterStartLine'.
            let maxInternalOffset = 0;
            for (const item of cluster.items) {
                let placed = false;
                let offset = 0;

                while (!placed) {
                    const currentLineIdx = clusterStartLine + offset;
                    if (!lines[currentLineIdx]) lines[currentLineIdx] = [];

                    // 1. Basic check: Does the item itself overlap any item already on this line?
                    const physicalOverlap = lines[currentLineIdx].some(other =>
                        item.drawInfo!.renderStart < other.drawInfo!.renderStop &&
                        other.drawInfo!.renderStart < item.drawInfo!.renderStop
                    );

                    // 2. Obstruction check: Does this item sit in the middle of a connection
                    // already established on this line? (The "A --- [B] --- C" problem)
                    let connectionObstruction = false;
                    for (const other of lines[currentLineIdx]) {
                        // Find connections for the item already on the line
                        const relatedConnections = cluster.connections.filter(c => c.from === other.id || c.to === other.id);

                        for (const conn of relatedConnections) {
                            const partnerId = (conn.from === other.id) ? conn.to : conn.from;
                            const partner = cluster.getItemById(partnerId);

                            if (partner && lines[currentLineIdx].includes(partner)) {
                                // We have a horizontal connection on this line.
                                // Does our NEW item sit between them?
                                const lineStart = Math.min(other.drawInfo!.renderStart, partner.drawInfo!.renderStart);
                                const lineEnd = Math.max(other.drawInfo!.renderStop, partner.drawInfo!.renderStop);

                                if (item.drawInfo!.renderStart > lineStart && item.drawInfo!.renderStop < lineEnd) {
                                    connectionObstruction = true;
                                    break;
                                }
                            }
                        }
                        if (connectionObstruction) break;
                    }

                    if (!physicalOverlap && !connectionObstruction) {
                        lines[currentLineIdx].push(item);
                        maxInternalOffset = Math.max(maxInternalOffset, offset);
                        placed = true;
                    } else {
                        offset++;
                    }
                }
            }

            // 3. Store the total height (number of lines) used by this cluster's bounding box.
            cluster.height = maxInternalOffset + 1;
            visited.push(cluster);
        }

        return lines;
    }

    private mergeClusters(clusters: Cluster[]) {
        let changed = true;
        let killed = new Set<Cluster>();
        while (changed) {
            changed = false;
            for (let i = 0; i < clusters.length; i++) {
                for (let j = 0; j < clusters.length; j++) {
                    const c1 = clusters[i];
                    const c2 = clusters[j];
                    if (i !== j && !killed.has(c1) && !killed.has(c2)) {
                        if (c1.isConnected(c2)) {
                            c1.mergeInto(c2);
                            killed.add(c1);
                            changed = true;
                        }
                    }
                }
            }
        }
        return clusters.filter(c => !killed.has(c)).sort((c1, c2) => {
            return c1.start - c2.start;
        });
    }

    /**
     * Sorts the items within each cluster using a depth-first
     * topological sort
     */
    private sortClusters(clusters: Cluster[]) {
        for (const cluster of clusters) {
            cluster.sortTopologically();
        }
        return;
    }

    /**
     * Finds the starting line index for a cluster, given
     * previously visited clusters.
     */
    private findLineIndex(cluster: Cluster, visited: Cluster[]) {
        let lineIndex = 0;
        for (const prev of visited) {
            if (prev.stop <= cluster.start) {
                continue; // Ignore
            } else if (prev.start >= cluster.stop) {
                continue; // Ignore
            } else { // Overlapping in time
                lineIndex = Math.max(lineIndex, prev.lineIndex + prev.items.length);
            }
        }
        return lineIndex;
    }
}

class Cluster {
    items: AnnotatedItem[] = [];
    connections: Connection[] = [];

    // Known IDs, either from an Item or a Connection
    private ids = new Set<string | number>();

    // Earliest start time among all items
    start!: number;

    // Latest end time among all items
    stop!: number;

    // Line index for the first item in this cluster.
    // The total number of lines is identical to the item count.
    lineIndex = 0;

    height!: number;

    constructor(item: AnnotatedItem) {
        this.addItem(item);
    }

    sortTopologically() {
        const order: AnnotatedItem[] = [];
        const visited = new Set<AnnotatedItem>();
        for (const item of this.items) {
            if (!visited.has(item)) {
                this.depthFirst(item, visited, order);
            }
        };

        this.items = order.reverse();
    }

    private depthFirst(item: AnnotatedItem, visited: Set<AnnotatedItem>, order: AnnotatedItem[]) {
        visited.add(item);

        const successors = this.getSuccessors(item);
        successors.forEach(successor => {
            if (!visited.has(successor)) {
                this.depthFirst(successor, visited, order);
            }
        });

        order.push(item);
    }

    private getSuccessors(item: AnnotatedItem) {
        if (item.id === undefined) {
            return [];
        }

        const successors: AnnotatedItem[] = [];
        for (const connection of this.connections) {
            if (connection.from === item.id) {
                const successor = this.getItemById(connection.to);
                if (successor) {
                    successors.push(successor);
                }
            }
        }
        return successors;
    }

    getItemById(id: string | number) {
        for (const item of this.items) {
            if (item.id !== undefined && item.id === id) {
                return item;
            }
        }
        return undefined;
    }

    mergeInto(other: Cluster) {
        for (const item of this.items) {
            other.addItem(item);
        }
        for (const connection of this.connections) {
            other.addConnection(connection);
        }
    }

    addItem(item: AnnotatedItem) {
        this.items.push(item);
        if (item.id !== undefined) {
            this.ids.add(item.id);
        }
        const itemStart = item.drawInfo!.renderStart;
        const itemStop = item.drawInfo!.renderStop;
        if (this.start === undefined || itemStart < this.start) {
            this.start = itemStart;
        }
        if (this.stop === undefined || itemStop > this.stop) {
            this.stop = itemStop;
        }
    }

    addConnection(connection: Connection) {
        this.connections.push(connection);
        if (connection.from !== undefined) {
            this.ids.add(connection.from);
        }
        if (connection.to !== undefined) {
            this.ids.add(connection.to);
        }
    }

    isConnected(other: Cluster): boolean {
        for (const id of this.ids) {
            if (other.ids.has(id)) {
                return true;
            }
        }
        return false;
    }

    toString() {
        return 'Cluster: ' + this.items.map(i => i.id);
    }
}
