/** Keep the catalogue sections and group instrument names naturally by maker.
 * Model numbers are numeric: 2/82N, 2/83N, 2/84N; N3, N4, N16.
 * Laboratory arrangements have no manufacturer, so retain their authored order.
 */
const instrumentOrder = new Intl.Collator('en-GB', { numeric: true, sensitivity: 'base' });

export function presetMenuGroups(presets) {
    const groups = new Map();
    for (const entry of Object.entries(presets)) {
        const group = entry[1].group || 'Other';
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group).push(entry);
    }
    for (const [group, items] of groups) {
        if (group !== 'Mathematical laboratories') {
            items.sort((a, b) => instrumentOrder.compare(a[1].name, b[1].name));
        }
    }
    return [...groups];
}
