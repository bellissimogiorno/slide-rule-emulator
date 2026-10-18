/** Native-browser cursor contract checks. Expected geometry is calculated from
 * programme data and measured scale rows, without importing cursor renderers. */
async () => {
    const { application } = await import('#main.js');
    const program = application.getProgram();
    const failures = [];
    const faces = [];
    const check = (condition, message, context) => {
        if (!condition) failures.push({ message, ...context });
    };
    const near = (actual, expected) => Math.abs(actual - expected) < .8;
    const box = element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    };
    for (const face of document.querySelectorAll('#ruleCanvas .rule-face')) {
        const sideName = face.dataset.side;
        const side = program.sides[sideName];
        const context = { preset: program.presetId, side: sideName };
        const body = face.querySelector('.rule-face-body');
        const zoom = body.getBoundingClientRect().width / body.offsetWidth;
        const pane = box(body.querySelector('.top-stator .tick-pane'));
        const top = box(body.querySelector('.top-stator')).top;
        const bottom = box(body.querySelector('.bottom-stator')).bottom;
        const cursor = body.querySelector('.cursor');
        const cursorBox = box(cursor);
        const main = getComputedStyle(cursor, '::after');
        check(near(cursorBox.top + parseFloat(main.top) * zoom, top + zoom)
            && near(cursorBox.bottom - parseFloat(main.bottom) * zoom, bottom - zoom),
            'Main hairline spans engraved rows without crossing external caps', context);
        const glass = getComputedStyle(cursor, '::before').backgroundColor;
        const alpha = glass.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        check((alpha ? Number(alpha[1]) : glass === 'transparent' ? 0 : 1) < .1,
            'Cursor glass must remain transparent', context);
        if (side.cursorFrame) {
            check(cursor.classList.contains(`cursor-frame-${side.cursorFrame}`),
                'Cursor frame material matches the selected specimen', context);
            check(cursor.querySelectorAll('.cursor-top-cap').length === 1
                && cursor.querySelectorAll('.cursor-bottom-cap').length === 1,
                'A historical frame has both external caps', context);
            check(Boolean(cursor.querySelector('.cursor-grip')), 'Frame supplies a main-hairline drag surface', context);
        }
        check(near(cursorBox.left + cursorBox.width / 2, pane.left + program.cursor * pane.width),
            'Main cursor position must agree with programme state', context);
        const rows = [...body.querySelectorAll('.rail')].flatMap(rail =>
            [...rail.querySelectorAll('.scale-row')].map((row, index) => ({
                rail: rail.dataset.rail, index: String(index), scale: row.dataset.scale, ...box(row)
            })));
        const marks = [...cursor.querySelectorAll('.cursor-mark')];
        let expectedCount = 0;
        for (const definition of side.cursorMarks || []) {
            const selected = rows.map((row, index) => ({ ...row, order: index }))
                .filter(row => !definition.scales || definition.scales.includes(row.scale));
            const runs = [];
            if (!definition.scales) runs.push(null);
            else for (const row of selected) {
                const previous = runs.at(-1);
                if (previous && previous.at(-1).order + 1 === row.order) previous.push(row);
                else runs.push([row]);
            }
            expectedCount += runs.length;
            const strokes = marks.filter(mark => mark.dataset.cursorMark === definition.id);
            check(strokes.length === runs.length, 'Each requested contiguous row interval needs one stroke',
                { ...context, mark: definition.id, expected: runs.length, actual: strokes.length });
            for (const stroke of strokes) {
                const line = stroke.querySelector('.cursor-mark-line');
                const actual = box(line);
                const detail = { ...context, mark: definition.id };
                check(near(actual.left + actual.width / 2,
                    pane.left + (program.cursor + definition.offset) * pane.width),
                    'Auxiliary hairline must use calibrated scale-length offset', detail);
                const run = runs.find(run => run && run[0].rail === stroke.dataset.cursorRail
                    && run[0].index === stroke.dataset.cursorRow);
                if (definition.scales) {
                    check(Boolean(run), 'Scoped stroke starts at an intended scale row', detail);
                    if (run) {
                        check(near(actual.top, run[0].top) && near(actual.bottom, run.at(-1).bottom),
                            'Scoped stroke must span precisely its contiguous scale rows', detail);
                    }
                } else {
                    check(near(actual.top, top + zoom) && near(actual.bottom, bottom - zoom),
                        'Full-height auxiliary stroke must stop at the engraved track edges', detail);
                }
                check(stroke.title === definition.label, 'Accessible auxiliary caption must be retained', detail);
                check(stroke.querySelectorAll('.cursor-mark-label').length === (definition.showLabel === false ? 0 : 1),
                    'Inline auxiliary label visibility must follow metadata', detail);
            }
        }
        check(marks.length === expectedCount, 'No unrequested auxiliary hairlines', context);
        const captions = [...cursor.querySelectorAll('.cursor-caption')];
        let expectedCaptions = 0;
        for (const definition of side.cursorCaptions || []) {
            const matches = captions.filter(caption => caption.dataset.cursorCaption === definition.id);
            const expectedRows = definition.zone === 'row' ? rows.filter(row => row.scale === definition.scale) : [null];
            expectedCaptions += expectedRows.length;
            check(matches.length === expectedRows.length, 'Each requested caption is rendered once per matching row',
                { ...context, caption: definition.id });
            for (const caption of matches) {
                const actual = box(caption);
                const detail = { ...context, caption: definition.id };
                const anchor = pane.left + (program.cursor + definition.offset) * pane.width;
                const actualAnchor = definition.align === 'start' ? actual.left - 3 * zoom
                    : definition.align === 'end' ? actual.right + 3 * zoom : actual.left + actual.width / 2;
                check(near(actualAnchor, anchor), 'Cursor caption must retain its calibrated anchor', detail);
                check(JSON.stringify([...caption.children].map(child => child.textContent)) === JSON.stringify(definition.lines),
                    'Cursor caption text must match metadata', detail);
                if (definition.zone === 'row') {
                    const row = expectedRows.find(row => row.rail === caption.dataset.cursorRail && row.index === caption.dataset.cursorRow);
                    check(Boolean(row), 'Row caption must follow its named scale', detail);
                    if (row) check(near(definition.edge === 'top' ? actual.bottom : actual.top,
                        definition.edge === 'top' ? row.top : row.bottom), 'Row caption follows requested row edge', detail);
                } else {
                    const cap = cursor.querySelector(definition.zone === 'topCap' ? '.cursor-top-cap' : '.cursor-bottom-cap');
                    check(Boolean(cap), 'Cap caption needs its corresponding cap', detail);
                    if (cap) {
                        const c = box(cap);
                        check(actual.top >= c.top - .8 && actual.bottom <= c.bottom + .8,
                            'Cap caption must fit vertically inside the cap', detail);
                    }
                }
                if (definition.fraction) {
                    check(parseFloat(getComputedStyle(caption.firstElementChild).borderBottomWidth) > 0,
                        'Fraction caption has a visible fraction bar', detail);
                }
            }
        }
        check(captions.length === expectedCaptions, 'No unrequested cursor captions', context);
        if (side.cursorWidth !== undefined) {
            // Physical width is normalized to engraved track length. The
            // minimum touch surface and engraved extrema may require more.
            const offsets = [...marks, ...captions].map(node => Number(node.dataset.cursorOffset));
            const required = Math.max(34 * zoom, side.cursorWidth * pane.width,
                ...offsets.map(offset => 2 * (Math.abs(offset) * pane.width + 14 * zoom)));
            check(near(cursorBox.width, required), 'Cursor width preserves physical proportion at current zoom',
                { ...context, expected: required, actual: cursorBox.width });
        }
        const clipping = body.querySelector('.cursor-window');
        if (clipping) {
            const bounds = box(clipping);
            check(near(bounds.left, pane.left) && near(bounds.width, pane.width),
                'Cursor clipping window must align with scale track', context);
            check(getComputedStyle(clipping).overflow === 'hidden', 'Calibrated glass is clipped at track ends', context);
        }
        if (side.cursorLineTone) {
            const colors = { red: 'rgb(155, 51, 37)', neutral: 'rgb(40, 37, 31)' };
            check(main.borderLeftColor === colors[side.cursorLineTone], 'Main hairline colour follows side metadata', context);
        }
        for (const cap of cursor.querySelectorAll('.cursor-cap')) {
            const bounds = box(cap);
            check(cap.classList.contains('cursor-top-cap') ? bounds.bottom <= top + .8 : bounds.top >= bottom - .8,
                'External cursor cap must not cover engraved scale rows', context);
        }
        faces.push({ ...context, mainPosition: program.cursor, rows: rows.length,
            marks: marks.length, captions: captions.length, width: cursorBox.width, zoom });
    }
    return { failures, faces };
}
