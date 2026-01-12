export function validateBatches(batches, strength) {
    const seenBatch = new Set();
    const rangesByType = {
        practical: [],
        tutorial: [],
    };

    const strengthNum = Number(strength);

    for (const batch of batches) {
        const key = `${batch.type}_${batch.code}`;
        if (seenBatch.has(key)) {
            return "Batch must have unique combination of code and type";
        }
        seenBatch.add(key);
        if (!["practical", "tutorial"].includes(batch.type)) {
            return "Batch must have valid type (practical | tutorial)";
        }

        const fromNum = Number(batch.rollRange?.from);
        const toNum = Number(batch.rollRange?.to);

        if (
            Number.isNaN(fromNum) ||
            Number.isNaN(toNum) ||
            fromNum >= toNum ||
            toNum > strengthNum
        ) {
            return `Invalid roll range for ${batch.code}`;
        }
        for (const existing of rangesByType[batch.type]) {
            if (fromNum <= existing.to && toNum >= existing.from) {
                return `Overlapping roll range in ${batch.type} batches (${batch.code})`;
            }
        }

        rangesByType[batch.type].push({ from: fromNum, to: toNum });
    }

    return null;
}
