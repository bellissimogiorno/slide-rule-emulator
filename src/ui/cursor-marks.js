/** Calibrated cursor marks and separate engraved captions belong to a face.
 * Offsets use fractions of the displayed track, never fixed pixel spacings.
 * Captions are presentation only: they cannot add a reading or a hairline.
 */
import { escapeHtml } from '#ui/html.js';

const faceRows = side => ['topStator', 'slide', 'bottomStator'].flatMap(rail =>
    side[rail].map((scale, index) => ({ rail, index, scale })));

export function marksForScale(side, scaleId) {
    return (side.cursorMarks || []).filter(mark => !mark.scales || mark.scales.includes(scaleId));
}

/** Merge adjacent selected rows into continuous engraved strokes. Separated
 * rows retain separate segments after customization, rather than crossing an
 * unrelated scale that happens to lie between them. */
export function cursorMarkSegments(side) {
    const rows = faceRows(side);
    return (side.cursorMarks || []).flatMap(mark => {
        if (!mark.scales) return [{ mark }];
        const segments = [];
        let current;
        for (const row of rows) {
            if (!mark.scales.includes(row.scale)) { current = null; continue; }
            if (!current) {
                current = { mark, ...row, endRail: row.rail, endIndex: row.index };
                segments.push(current);
            } else {
                current.endRail = row.rail;
                current.endIndex = row.index;
            }
        }
        return segments;
    });
}

export function cursorCaptionSegments(side) {
    const rows = faceRows(side);
    return (side.cursorCaptions || []).flatMap(caption => caption.zone === 'row'
        ? rows.filter(row => row.scale === caption.scale).map(row => ({ caption, ...row }))
        : [{ caption }]);
}

export function cursorCapClasses(side) {
    const zones = new Set((side.cursorCaptions || []).map(caption => caption.zone));
    return [zones.has('topCap') ? 'cursor-cap-top' : '', zones.has('bottomCap') ? 'cursor-cap-bottom' : '']
        .filter(Boolean).join(' ');
}

const rowAttributes = (rail, index) => rail
    ? ` data-cursor-rail="${rail}" data-cursor-row="${index}"` : '';

export function renderCursor(side, id) {
    const segments = cursorMarkSegments(side), captions = cursorCaptionSegments(side);
    const tone = side.cursorLineTone ? ` cursor-lines-${side.cursorLineTone}` : '';
    if (!segments.length && !captions.length) return `<div id="${escapeHtml(id)}" class="cursor${tone}"></div>`;
    const marks = segments.map(({ mark, rail, index, endRail, endIndex }) => {
        const row = rowAttributes(rail, index) + (rail
            ? ` data-cursor-end-rail="${endRail}" data-cursor-end-row="${endIndex}"` : '');
        // Backwards-compatible inline captions for programmes without separate
        // cap/gauge annotations. Upper/lower banks face outward.
        const parts = mark.label.split(';').map(part => part.trim());
        const caption = (rail === 'bottomStator' ? parts : parts.reverse())
            .map(part => `<span>${escapeHtml(part)}</span>`).join('');
        const classes = ['cursor-mark', rail ? 'scoped-mark' : 'long-mark',
            mark.labelTone === 'red' ? 'red-caption' : ''].filter(Boolean).join(' ');
        const label = mark.showLabel === false ? '' : `<span class="cursor-mark-label">${caption}</span>`;
        return `<span class="${classes}" data-cursor-mark="${escapeHtml(mark.id)}" data-cursor-offset="${mark.offset}"${row} title="${escapeHtml(mark.label)}"><span class="cursor-mark-line"></span>${label}</span>`;
    }).join('');
    const capClasses = cursorCapClasses(side);
    const caps = `${capClasses.includes('cursor-cap-top') ? '<span class="cursor-cap cursor-top-cap"></span>' : ''}${capClasses.includes('cursor-cap-bottom') ? '<span class="cursor-cap cursor-bottom-cap"></span>' : ''}`;
    const annotationMarkup = captions.map(({ caption, rail, index }) => {
        const classes = ['cursor-caption', `caption-${caption.zone}`, `caption-align-${caption.align || 'center'}`,
            caption.tone === 'red' ? 'red-caption' : '', caption.fraction ? 'caption-fraction' : ''].filter(Boolean).join(' ');
        const row = rowAttributes(rail, index);
        const edge = caption.zone === 'row' ? ` data-cursor-edge="${caption.edge}"` : '';
        return `<span class="${classes}" data-cursor-caption="${escapeHtml(caption.id)}" data-cursor-offset="${caption.offset}" data-cursor-zone="${caption.zone}"${row}${edge}>${caption.lines.map(line => `<span>${escapeHtml(line)}</span>`).join('')}</span>`;
    }).join('');
    return `<div class="cursor-window"><div id="${escapeHtml(id)}" class="cursor has-auxiliary${tone}">${caps}<span class="cursor-grip" title="Drag the main cursor"></span>${marks}${annotationMarkup}</div></div>`;
}

/** The symmetric glass contains the outermost mark/caption plus edge padding.
 * Empty glass is paint only: just the centre grip, marks and caps catch a drag. */
export function cursorGlassWidth(offsets, trackWidth) {
    return 2 * Math.max(17, ...offsets.map(offset => Math.abs(offset) * trackWidth + 14));
}

export function positionCursorMarks(face, geometry) {
    const cursor = face.querySelector('.cursor');
    const window = cursor?.parentElement;
    if (!window?.classList.contains('cursor-window')) return;
    window.style.left = `${geometry.left}px`;
    window.style.width = `${geometry.width}px`;
    const marks = [...cursor.querySelectorAll('.cursor-mark')];
    const captions = [...cursor.querySelectorAll('.cursor-caption')];
    const offsets = [...marks, ...captions].map(node => Number(node.dataset.cursorOffset));
    const width = cursorGlassWidth(offsets, geometry.width);
    cursor.style.width = `${width}px`;
    const faceBox = face.getBoundingClientRect();
    const zoom = faceBox.width / Math.max(1, face.offsetWidth);
    const rows = new Map();
    for (const rail of face.querySelectorAll('.rail')) {
        [...rail.querySelectorAll('.scale-row')].forEach((row, index) =>
            rows.set(`${rail.dataset.rail}:${index}`, row));
    }
    const localBox = row => {
        const box = row.getBoundingClientRect();
        return { top: (box.top - faceBox.top) / zoom, height: box.height / zoom };
    };
    for (const mark of marks) {
        mark.style.left = `${width / 2 + Number(mark.dataset.cursorOffset) * geometry.width}px`;
        if (!mark.dataset.cursorRail) continue;
        const row = rows.get(`${mark.dataset.cursorRail}:${mark.dataset.cursorRow}`);
        const endRow = rows.get(`${mark.dataset.cursorEndRail}:${mark.dataset.cursorEndRow}`) || row;
        if (!row) continue;
        const start = localBox(row), end = localBox(endRow);
        mark.style.top = `${start.top}px`;
        mark.style.height = `${end.top + end.height - start.top}px`;
        mark.style.bottom = 'auto';
        mark.classList.toggle('label-at-bottom', row.classList.contains('axis-bottom'));
    }
    for (const caption of captions) {
        caption.style.left = `${width / 2 + Number(caption.dataset.cursorOffset) * geometry.width}px`;
        if (caption.dataset.cursorZone !== 'row') continue;
        const row = rows.get(`${caption.dataset.cursorRail}:${caption.dataset.cursorRow}`);
        if (!row) continue;
        const box = localBox(row), topEdge = caption.dataset.cursorEdge === 'top';
        caption.style.top = `${box.top + (topEdge ? 0 : box.height)}px`;
        caption.classList.toggle('caption-before-row', topEdge);
    }
}
