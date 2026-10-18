/** Retain readout cards during motion. Rebuild only for a different layout or
 * library; update text in place rather than reparsing the complete panel. */
import { visibleSideKeys } from '#model/view.js';
import { RAILS } from '#core/scale-types.js';
import { renderReadout } from '#ui/readout.js';
import { cursorScaleReadings } from '#ui/readout-values.js';
import { marksForScale } from '#ui/cursor-marks.js';

export function createReadoutView(root) {
    let previousKey, previousLibrary, cards = [];
    return {
        update(state, library) {
            const key = JSON.stringify([state.viewMode, visibleSideKeys(state).map(id => {
                const side = state.sides[id];
                return [id, side.name, side.cursorMarks, ...RAILS.map(rail => side[rail])];
            })]);
            if (key !== previousKey || library !== previousLibrary) {
                root.innerHTML = renderReadout(state, library);
                cards = [...root.querySelectorAll('.readout-card')].map(node => ({
                    node, value: node.querySelector('.value'), definition: library[node.dataset.readoutScale],
                    moving: node.closest('[data-readout-rail]').dataset.readoutRail === 'slide',
                    marks: marksForScale(state.sides[node.closest('[data-readout-side]').dataset.readoutSide], node.dataset.readoutScale)
                }));
                previousKey = key;
                previousLibrary = library;
                return;
            }
            for (const { node, value, definition, moving, marks } of cards) {
                const result = cursorScaleReadings(definition, state.cursor - (moving ? state.slideOffset : 0), library, marks, state.cursor);
                if (node.classList.contains('outside') !== result.outside)
                    node.classList.toggle('outside', result.outside);
                if (result.multi) {
                    // Segmented rows can change their number of visible readings.
                    while (value.children.length > result.texts.length) value.lastChild.remove();
                    while (value.children.length < result.texts.length)
                        value.append(root.ownerDocument.createElement('span'));
                    result.texts.forEach((text, i) => {
                        if (value.children[i].textContent !== text) value.children[i].textContent = text;
                    });
                } else if (value.textContent !== result.texts[0]) value.textContent = result.texts[0];
            }
        }
    };
}
