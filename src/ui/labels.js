import { clamp } from "#core/numbers.js";
import { escapeHtml } from "#ui/html.js";
function optimizeScaleLabels(ruleCanvas, compact) {
    const demote = (group, choices, selector) => {
        const selected = new Set(choices.map(choice => choice.el.dataset.pos));
        group.querySelectorAll(selector).forEach(tick => {
            tick.classList.toggle("unlabelled-major", !selected.has(tick.dataset.pos));
        });
    };
    ruleCanvas.querySelectorAll(".unlabelled-major").forEach(tick => tick.classList.remove("unlabelled-major"));
    ruleCanvas.querySelectorAll(".tick-mover").forEach(group => {
        const useCompact = compact && !group.closest(".no-compact-labels");
        if (useCompact)
            demote(group, optimizeCompactLabelLine(group, ".tick-label", 2.0), ".tick");
        else
            optimizeLabelLine(group, ".tick-label", 2.2);
    });
    ruleCanvas.querySelectorAll(".syncro-track").forEach(group => {
        const useCompact = compact && !group.closest(".no-compact-labels");
        if (useCompact) {
            const above = optimizeCompactLabelLine(group, ".syncro-number.positive", 2.0);
            const below = optimizeCompactLabelLine(group, ".syncro-number.negative", 2.0, above);
            demote(group, [...above, ...below], ".syncro-tick");
        }
        else {
            optimizeLabelLine(group, ".syncro-number.positive", 2.5);
            optimizeLabelLine(group, ".syncro-number.negative", 2.5);
        }
    });
}
function labelText(el) {
    return String(el.dataset.labelText || el.textContent || "");
}
function resetLabelLayout(el) {
    const text = labelText(el);
    el.classList.remove("compact-right", "compact-left", "compact-split", "compact-centred");
    el.innerHTML = escapeHtml(text);
    el.style.removeProperty("transform");
    el.style.removeProperty("--compact-left-width");
    el.style.removeProperty("--compact-right-width");
    el.dataset.compactMode = "centred";
    el.removeAttribute("data-layout-start");
    el.removeAttribute("data-layout-end");
}
function measureLabelText(el, text) {
    // Range measures the actual rendered font without inserting a probe and
    // forcing a fresh layout for every label or possible split.
    const node = el.firstChild;
    const source = node && node.nodeType === 3 ? node.textContent : "";
    const offset = source.indexOf(String(text));
    if (offset < 0)
        return 0.5;
    const range = el.ownerDocument.createRange();
    range.setStart(node, offset);
    range.setEnd(node, offset + String(text).length);
    const track = el.closest(".tick-mover");
    const zoom = track && track.clientWidth ? track.getBoundingClientRect().width / track.clientWidth : 1;
    return Math.max(0.5, range.getBoundingClientRect().width / zoom);
}
function chooseCompactSplit(el, text) {
    const source = String(text);
    if (source.includes("|")) {
        const parts = source.split("|").map(part => part.trim());
        if (parts.length === 2 && parts.every(Boolean))
            return { left: parts[0], right: parts[1] };
    }
    const chars = [...source];
    if (chars.length < 2 || /[|/eE]/.test(source))
        return null;
    let boundary = Math.ceil(chars.length / 2);
    const small = source.match(/^([+\-]?0\.0+)([1-9])/);
    if (small)
        boundary = small[1].length;
    const choices = [...new Set([boundary, boundary - 1, boundary + 1])]
        .filter(i => i > 0 && i < chars.length)
        .map(i => ({ left: chars.slice(0, i).join(""), right: chars.slice(i).join("") }))
        .filter(parts => /\d/.test(parts.left) && /\d/.test(parts.right) && !/[.+\-]$/.test(parts.left));
    return choices[0] || null;
}
function compactCandidateIntervals(el, x, width, obstacles) {
    const text = labelText(el), textWidth = measureLabelText(el, text);
    const gap = 1.6, options = [];
    const add = (mode, start, end, bonus, split = null) => {
        if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0.6 || end > width - 0.6)
            return;
        // Only the label's OWN long tick may intersect its interval. This is
        // essential: a label-label check alone permits ticks through numerals.
        if (obstacles.some(tickX => Math.abs(tickX - x) > 0.3 && tickX > start - 1.0 && tickX < end + 1.0))
            return;
        options.push({ mode, textStart: start, textEnd: end, start: Math.min(start, x - 0.5), end: Math.max(end, x + 0.5), bonus, split });
    };
    if (!text.includes("|"))
        add("right", x + gap, x + gap + textWidth, 90);
    const split = chooseCompactSplit(el, text);
    if (split)
        add("split", x - gap - measureLabelText(el, split.left), x + gap + measureLabelText(el, split.right), 70, split);
    if (!text.includes("|"))
        add("left", x - gap - textWidth, x - gap, x > width - 2 ? 100 : 30);
    return options;
}
function pruneCompactStates(states, limit = 180) {
    states.sort((a, b) => a.end - b.end || b.score - a.score);
    const frontier = [];
    let bestScore = -Infinity;
    for (const stateItem of states) {
        if (stateItem.score <= bestScore + 0.001)
            continue;
        frontier.push(stateItem);
        bestScore = Math.max(bestScore, stateItem.score);
    }
    if (frontier.length <= limit)
        return frontier;
    return frontier.sort((a, b) => b.score - a.score || a.end - b.end).slice(0, limit).sort((a, b) => a.end - b.end);
}
function applyCompactPlacement(el, choice) {
    resetLabelLayout(el);
    if (!choice) {
        el.classList.add("label-hidden");
        return;
    }
    el.classList.remove("label-hidden");
    el.classList.add(`compact-${choice.mode}`);
    el.dataset.compactMode = choice.mode;
    el.dataset.layoutStart = choice.textStart.toFixed(2);
    el.dataset.layoutEnd = choice.textEnd.toFixed(2);
    if (choice.mode === "split" && choice.split) {
        el.innerHTML = `<span class="compact-part compact-part-left">${escapeHtml(choice.split.left)}</span><span class="compact-part compact-part-right">${escapeHtml(choice.split.right)}</span>`;
    }
}
function optimizeCompactLabelLine(container, selector, gap, protectedChoices = []) {
    const labels = [...container.querySelectorAll(selector)];
    if (!labels.length)
        return [];
    labels.forEach(el => { resetLabelLayout(el); el.classList.remove("label-hidden"); });
    const width = Math.max(1, container.clientWidth);
    // Selected numerals and their own long tick reserve one interval. Other
    // major ticks remain present but are shortened into the graduation band.
    // On shared LL rows, the second line must also protect the first line's
    // long ticks and must not introduce a long tick through its numerals.
    const obstacles = protectedChoices.map(choice => choice.x);
    const items = labels.map(el => {
        const x = clamp(Number(el.dataset.pos), 0, 1) * width;
        const blocksOtherLine = protectedChoices.some(choice => Math.abs(choice.x - x) > 0.3 &&
            x > choice.option.textStart - 1 && x < choice.option.textEnd + 1);
        return { el, x, priority: Number(el.dataset.priority) || 100,
            options: blocksOtherLine ? [] : compactCandidateIntervals(el, x, width, obstacles) };
    }).sort((a, b) => a.x - b.x || b.priority - a.priority);
    // Weighted non-overlapping placement. Linked trails avoid quadratic
    // copying of the whole choice history for every candidate.
    let states = [{ end: -Infinity, score: 0, trail: null }];
    for (const item of items) {
        const next = [...states];
        for (const previous of states)
            for (const option of item.options) {
                if (option.start >= previous.end + gap)
                    next.push({
                        end: option.end, score: previous.score + item.priority + option.bonus,
                        trail: { item, option, previous: previous.trail }
                    });
            }
        states = pruneCompactStates(next);
    }
    const best = states.reduce((a, b) => b.score > a.score ? b : a);
    const chosen = new Map();
    for (let trail = best.trail; trail; trail = trail.previous)
        chosen.set(trail.item, trail.option);
    items.forEach(item => applyCompactPlacement(item.el, chosen.get(item)));
    return [...chosen].map(([item, option]) => ({ el: item.el, x: item.x, option }));
}
function optimizeLabelLine(container, selector, gap) {
    const labels = [...container.querySelectorAll(selector)];
    if (!labels.length)
        return;
    labels.forEach(el => {
        resetLabelLayout(el);
        el.classList.remove("label-hidden");
    });
    const width = Math.max(1, container.clientWidth);
    const items = labels.map(el => {
        const pos = clamp(Number(el.dataset.pos), 0, 1);
        const textWidth = measureLabelText(el, labelText(el));
        let left = pos * width - textWidth / 2;
        if (el.classList.contains("edge-left"))
            left = pos * width;
        if (el.classList.contains("edge-right"))
            left = pos * width - textWidth;
        left = Math.max(0, Math.min(width - textWidth, left));
        const transform = `translateX(${left - pos * width}px)`;
        const priority = Number(el.dataset.priority) || 100;
        return { el, transform, start: left - gap, end: left + textWidth + gap, weight: priority + Math.max(0, 90 - textWidth) };
    }).sort((a, b) => a.end - b.end || a.start - b.start);
    items.forEach(item => { item.el.style.transform = item.transform; });
    const ends = items.map(item => item.end);
    const previous = items.map((item, i) => {
        let lo = 0, hi = i - 1, answer = -1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            if (ends[mid] <= item.start) {
                answer = mid;
                lo = mid + 1;
            }
            else
                hi = mid - 1;
        }
        return answer;
    });
    const dp = new Array(items.length + 1).fill(0);
    for (let i = 1; i <= items.length; i++) {
        const item = items[i - 1];
        dp[i] = Math.max(dp[i - 1], item.weight + dp[previous[i - 1] + 1]);
    }
    const selected = new Set();
    let i = items.length - 1;
    while (i >= 0) {
        const include = items[i].weight + dp[previous[i] + 1];
        const exclude = dp[i];
        if (include > exclude) {
            selected.add(items[i].el);
            i = previous[i];
        }
        else
            i -= 1;
    }
    labels.forEach(el => el.classList.toggle("label-hidden", !selected.has(el)));
}
export { optimizeScaleLabels, labelText, resetLabelLayout, measureLabelText, chooseCompactSplit, compactCandidateIntervals, pruneCompactStates, applyCompactPlacement, optimizeCompactLabelLine, optimizeLabelLine };
