function niceNum(range: number, round: boolean): number {
    if (range === 0) return 0;
    const absRange: number = Math.abs(range);
    const exponent: number = Math.floor(Math.log10(absRange));
    const fraction: number = absRange / Math.pow(10, exponent);
    let niceFraction: number;

    if (round) {
        if (fraction < 1.5) {
            niceFraction = 1;
        } else if (fraction < 3) {
            niceFraction = 2;
        } else if (fraction < 7) {
            niceFraction = 5;
        } else {
            niceFraction = 10;
        }
    } else {
        if (fraction <= 1) {
            niceFraction = 1;
        } else if (fraction <= 2) {
            niceFraction = 2;
        } else if (fraction <= 5) {
            niceFraction = 5;
        } else {
            niceFraction = 10;
        }
    }

    return (range < 0 ? -1 : 1) * niceFraction * Math.pow(10, exponent);
}

/**
 * @param height Total available height
 * @param minSpacingFactor  Multiplier for font size to ensure readable spacing (1.5-2 is typical)
 */
export function generateTicksForHeight(dataMin: number, dataMax: number, height: number, textSize: number, minSpacingFactor: number = 1.5): number[] {
    const tickHeight = textSize * minSpacingFactor;
    const maxTicks = Math.floor(height / tickHeight);
    const adjustedMaxTicks = Math.max(2, Math.min(maxTicks, 11));
    return generateTicks(dataMin, dataMax, adjustedMaxTicks);
}

export function generateTicks(
    dataMin: number,
    dataMax: number,
    maxTicks: number,
): number[] {
    if (dataMin > dataMax) {
        [dataMin, dataMax] = [dataMax, dataMin];
    }

    if (dataMin === dataMax) {
        // Handle zero range case
        if (dataMin === 0) {
            return [0];
        }
        // Expand slightly
        const grace: number = Math.abs(dataMin) * 0.01 || 1;
        dataMin -= grace;
        dataMax += grace;
    }

    const range: number = niceNum(dataMax - dataMin, false);
    let tickSpacing = niceNum(range / (maxTicks - 1), true);

    let niceMin = Math.floor(dataMin / tickSpacing) * tickSpacing;
    let niceMax = Math.ceil(dataMax / tickSpacing) * tickSpacing;

    let numSteps = Math.ceil((niceMax - niceMin) / tickSpacing);

    // If exceeding, adjust spacing once
    if (numSteps > maxTicks - 1) {
        tickSpacing = niceNum((niceMax - niceMin) / (maxTicks - 1), true);
        niceMin = Math.floor(dataMin / tickSpacing) * tickSpacing;
        niceMax = Math.ceil(dataMax / tickSpacing) * tickSpacing;
        numSteps = Math.ceil((niceMax - niceMin) / tickSpacing);
    }

    const ticks: number[] = [];
    for (let value: number = niceMin; value <= niceMax; value += tickSpacing) {
        // Handle floating point precision
        ticks.push(Math.round(value * 1e12) / 1e12);
    }

    return ticks;
}
