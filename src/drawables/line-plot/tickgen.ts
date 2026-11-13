/**
 * Number expressed as `mantissa * 10^exponent`.
 */
interface Decimal {
    mantissa: number;
    exponent: number;
}

/**
 * Round a positive number up to 1, 2, 5 or 10 times a power of ten.
 */
function niceCeil(value: number): Decimal {
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / Math.pow(10, exponent);
    let mantissa: number;
    if (fraction <= 1) {
        mantissa = 1;
    } else if (fraction <= 2) {
        mantissa = 2;
    } else if (fraction <= 5) {
        mantissa = 5;
    } else {
        mantissa = 10;
    }
    return { mantissa, exponent };
}

/**
 * Round a positive number to 1, 2 or 5 times a power of ten, scaled by
 * an additional power of ten. The scaling is kept separate so that the
 * rounding thresholds are applied to a small number, without floating
 * point error from large or small magnitudes.
 */
function niceStep(value: number, scaleExponent: number): Decimal {
    let exponent = Math.floor(Math.log10(value));
    const fraction = value / Math.pow(10, exponent);
    let mantissa: number;
    if (fraction < 1.5) {
        mantissa = 1;
    } else if (fraction < 3) {
        mantissa = 2;
    } else if (fraction < 7) {
        mantissa = 5;
    } else {
        mantissa = 1;
        exponent++;
    }
    return { mantissa, exponent: exponent + scaleExponent };
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

/**
 * Returns the k-th multiple of the step. The value is obtained by parsing
 * its decimal notation, so that it is the double closest to the intended
 * value (e.g. 0.3 rather than 0.30000000000000004, 2e38 rather than
 * 1.9999999999999996e38).
 */
function tickValue(k: number, step: Decimal) {
    const n = k * step.mantissa;
    if (Number.isSafeInteger(n)) {
        return Number(`${n}e${step.exponent}`);
    }
    return n * Math.pow(10, step.exponent);
}

function tickIndexRange(dataMin: number, dataMax: number, step: Decimal): [number, number] {
    const spacing = tickValue(1, step);
    // Tolerate floating point error on values that are exact multiples
    const kMin = Math.floor(dataMin / spacing + 1e-9);
    const kMax = Math.ceil(dataMax / spacing - 1e-9);
    return [kMin, Math.max(kMin, kMax)];
}

export function generateTicks(
    dataMin: number,
    dataMax: number,
    maxTicks: number,
): number[] {
    if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
        return [];
    }
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

    const range = niceCeil(dataMax - dataMin);
    if (!Number.isFinite(range.exponent)) {
        return [];
    }
    let step = niceStep(range.mantissa / (maxTicks - 1), range.exponent);
    let [kMin, kMax] = tickIndexRange(dataMin, dataMax, step);

    // If exceeding, adjust spacing once
    if (kMax - kMin > maxTicks - 1) {
        step = niceStep((kMax - kMin) * step.mantissa / (maxTicks - 1), step.exponent);
        [kMin, kMax] = tickIndexRange(dataMin, dataMax, step);
    }

    const ticks: number[] = [];
    for (let k = kMin; k <= kMax; k++) {
        ticks.push(tickValue(k, step));
    }
    return ticks;
}
