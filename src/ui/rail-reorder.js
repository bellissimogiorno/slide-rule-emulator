/** Pointer/keyboard scale ordering. A ghost and insertion line preview a drag;
 * the programme changes only through onMove at drop/keyboard activation. There are
 * no HTML5 drag payloads, document-wide shortcuts or scale-ID-based row keys.
 */
import { adjacentScalePosition } from "#model/scale-order.js";
import { railLabel } from "#ui/html.js";

export function createRailReorder({ root, status, onMove, refresh, signal }) {
    const document = root.ownerDocument, window = document.defaultView;
    const lifetime = new window.AbortController();
    const listen = (target, type, fn) => target.addEventListener(type, fn, { signal: lifetime.signal });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const animations = new Map();
    let drag = null, scrollFrame = 0, destroyed = false;
    const rows = list => [...list.querySelectorAll(".scale-control-row")];
    const lists = () => [...root.querySelectorAll(".rail-row-list")];
    const location = row => ({ rail: row.parentElement.dataset.rail, index: rows(row.parentElement).indexOf(row) });
    const positions = () => new Map([...root.querySelectorAll(".scale-control-row")].map(row => [row, row.getBoundingClientRect()]));

    function stopAnimations() {
        for (const animation of animations.values()) animation.cancel();
        animations.clear();
    }
    function animateFrom(before) {
        if (reducedMotion.matches) return;
        for (const [row, old] of before) {
            if (!row.isConnected || row.classList.contains("is-placeholder") || !row.animate) continue;
            const next = row.getBoundingClientRect();
            const dx = old.left - next.left, dy = old.top - next.top;
            if (Math.abs(dx) + Math.abs(dy) < .5) continue;
            const animation = row.animate([
                { transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }
            ], { duration: 180, easing: "cubic-bezier(.2,.7,.2,1)" });
            animations.set(row, animation);
            animation.onfinish = () => { if (animations.get(row) === animation) animations.delete(row); };
        }
    }
    function insert(row, list, index) {
        const others = rows(list).filter(item => item !== row);
        list.insertBefore(row, others[index] || list.querySelector(".rail-empty"));
    }
    function announce(row) {
        const place = location(row);
        status.textContent = `${row.querySelector("select").value} moved to ${railLabel(place.rail)}, position ${place.index + 1} of ${rows(row.parentElement).length}.`;
    }
    function focusAfter(row, control) {
        const next = control?.isConnected && !control.disabled ? control : row.querySelector(".scale-grip");
        next.focus({ preventScroll: true });
    }
    function committedMove(row, list, index, control) {
        const from = location(row), to = { rail: list.dataset.rail, index };
        if (from.rail === to.rail && from.index === to.index) return;
        const before = positions();
        stopAnimations();
        if (!onMove(from, to)) return;
        insert(row, list, index);
        refresh();
        animateFrom(before);
        focusAfter(row, control);
        announce(row);
    }
    function click(event) {
        const button = event.target.closest("button[data-action]");
        if (!button || drag) return;
        const direction = button.dataset.action === "up" ? -1 : button.dataset.action === "down" ? 1 : 0;
        const row = button.closest(".scale-control-row");
        if (!direction || !row || button.disabled) return;
        verticalMove(row, direction, button);
    }
    function verticalMove(row, direction, control) {
        const available = lists();
        const side = Object.fromEntries(available.map(list => [list.dataset.rail, rows(list)]));
        const target = adjacentScalePosition(side, location(row), direction);
        if (target) committedMove(row, available.find(list => list.dataset.rail === target.rail), target.index, control);
    }
    function keydown(event) {
        if (event.key === "Escape" && drag) {
            event.preventDefault(); cancel(); return;
        }
        if (drag && event.key === "Tab") { cancel(false); return; }
        const handle = event.target.closest(".scale-grip");
        if (!handle || drag || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const row = handle.closest(".scale-control-row");
        let list = row.parentElement;
        let { index } = location(row);
        switch (event.key) {
            case "ArrowUp":
            case "ArrowDown":
                event.preventDefault();
                verticalMove(row, event.key === "ArrowUp" ? -1 : 1, handle);
                return;
            case "Home": index = 0; break;
            case "End": index = rows(list).length - 1; break;
            case "ArrowLeft":
            case "ArrowRight": {
                const available = lists(), direction = event.key === "ArrowLeft" ? -1 : 1;
                const next = available[available.indexOf(list) + direction];
                if (next) { list = next; index = Math.min(index, rows(list).length); }
                break;
            }
            default: return;
        }
        event.preventDefault();
        committedMove(row, list, index, handle);
    }
    function pointerdown(event) {
        const handle = event.target.closest(".scale-grip");
        if (!handle || drag || event.isPrimary === false || event.button !== 0) return;
        const row = handle.closest(".scale-control-row");
        stopAnimations();
        const box = row.getBoundingClientRect();
        drag = { row, handle, from: location(row), origin: row.parentElement, pointerId: event.pointerId,
            viewportWidth: window.innerWidth, viewportHeight: window.innerHeight,
            startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY,
            offsetX: event.clientX - box.left, offsetY: event.clientY - box.top, width: box.width, ghost: null, marker: null, target: null };
        handle.focus({ preventScroll: true });
        root.setPointerCapture(event.pointerId);
        event.preventDefault();
    }
    function startPreview() {
        const ghost = drag.row.cloneNode(true);
        // A select's current value need not match its original selected attribute.
        ghost.querySelector("select").value = drag.row.querySelector("select").value;
        ghost.classList.add("reorder-ghost");
        ghost.setAttribute("aria-hidden", "true");
        ghost.setAttribute("inert", "");
        ghost.setAttribute("data-runtime-only", "");
        ghost.style.width = `${drag.width}px`;
        document.body.append(ghost);
        drag.ghost = ghost;
        const marker = document.createElement("div");
        marker.className = "reorder-drop-marker";
        marker.setAttribute("aria-hidden", "true");
        marker.setAttribute("data-runtime-only", "");
        document.body.append(marker);
        drag.marker = marker;
        drag.row.classList.add("is-placeholder");
        root.classList.add("is-reordering");
        status.textContent = `Moving ${drag.row.querySelector("select").value}. Drop in a rail; Escape cancels.`;
        scrollFrame = window.requestAnimationFrame(autoScroll);
    }
    function targetAt(x, y) {
        for (const list of lists()) {
            const region = list.closest(".rail-editor").getBoundingClientRect();
            if (x < region.left - 8 || x > region.right + 8 || y < region.top || y > region.bottom + 3) continue;
            const others = rows(list).filter(row => row !== drag.row);
            if (list !== drag.origin && others.length >= 40) return null;
            // Offset positions ignore the visual FLIP animation. A stationary
            // pointer must not repeatedly swap with a row animating beneath it.
            const top = list.getBoundingClientRect().top;
            let index = others.findIndex(row => y < top + row.offsetTop + row.offsetHeight / 2);
            if (index < 0) index = others.length;
            return { list, index };
        }
        return null;
    }
    function previewAtPointer() {
        if (!drag?.ghost) return;
        drag.ghost.style.transform = `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px)`;
        const target = targetAt(drag.x, drag.y);
        drag.target = target;
        drag.ghost.classList.toggle("invalid-drop", !target);
        drag.marker.hidden = !target;
        if (!target) return;
        // Keep the original slot occupied until drop. An insertion line gives
        // a stable target, even in an empty rail; lists cannot jump away as the
        // source slot disappears. The final order animates only after commit.
        const others = rows(target.list).filter(row => row !== drag.row);
        const next = others[target.index];
        const previous = others[target.index - 1];
        const box = target.list.getBoundingClientRect();
        const offset = next ? next.offsetTop - 2 : previous ? previous.offsetTop + previous.offsetHeight + 2 : 2;
        Object.assign(drag.marker.style, { left: `${box.left}px`, top: `${box.top + offset}px`, width: `${box.width}px` });
        drag.marker.dataset.rail = target.list.dataset.rail;
    }

    function pointermove(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (window.innerWidth !== drag.viewportWidth || window.innerHeight !== drag.viewportHeight) { cancel(); return; }
        drag.x = event.clientX; drag.y = event.clientY;
        if (!drag.ghost && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 5) return;
        if (!drag.ghost) startPreview();
        previewAtPointer();
        event.preventDefault();
    }
    function autoScroll() {
        scrollFrame = 0;
        if (!drag?.ghost) return;
        const region = root.getBoundingClientRect(), edge = 60;
        if (drag.x >= region.left - 16 && drag.x <= region.right + 16) {
            const delta = drag.y < edge ? -Math.min(12, (edge - drag.y) / 4)
                : drag.y > window.innerHeight - edge ? Math.min(12, (drag.y - window.innerHeight + edge) / 4) : 0;
            if (delta) { window.scrollBy(0, delta); previewAtPointer(); }
        }
        scrollFrame = window.requestAnimationFrame(autoScroll);
    }
    function endPreview(accept, restoreFocus = true) {
        if (!drag) return;
        const current = drag;
        drag = null; // releasing capture may dispatch lostpointercapture
        window.cancelAnimationFrame(scrollFrame); scrollFrame = 0;
        const destination = current.target && { rail: current.target.list.dataset.rail, index: current.target.index };
        const before = positions();
        let accepted = false;
        if (accept && current.ghost && destination) accepted = onMove(current.from, destination);
        if (accepted) before.set(current.row, current.ghost.getBoundingClientRect());
        stopAnimations();
        if (accepted) insert(current.row, current.target.list, current.target.index);
        current.row.classList.remove("is-placeholder");
        current.ghost?.remove();
        current.marker?.remove();
        root.classList.remove("is-reordering");
        if (root.hasPointerCapture(current.pointerId)) root.releasePointerCapture(current.pointerId);
        refresh();
        animateFrom(before);
        if (restoreFocus) focusAfter(current.row, current.handle);
        if (accepted) announce(current.row);
        else if (current.ghost) status.textContent = "Move cancelled. Scale order is unchanged.";
    }
    function pointerup(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        if (window.innerWidth !== drag.viewportWidth || window.innerHeight !== drag.viewportHeight) { cancel(); return; }
        drag.x = event.clientX; drag.y = event.clientY;
        previewAtPointer();
        endPreview(Boolean(drag.ghost && targetAt(drag.x, drag.y)));
    }
    function cancel(restoreFocus = true) { endPreview(false, restoreFocus); }
    function pointercancel(event) { if (drag && event.pointerId === drag.pointerId) cancel(); }
    function destroy() {
        if (destroyed) return;
        cancel(false); stopAnimations(); lifetime.abort(); destroyed = true;
    }
    listen(root, "click", click);
    listen(root, "keydown", keydown);
    listen(root, "pointerdown", pointerdown);
    listen(window, "pointermove", pointermove);
    listen(window, "pointerup", pointerup);
    listen(window, "pointercancel", pointercancel);
    listen(root, "lostpointercapture", pointercancel);
    listen(window, "keydown", event => {
        if (drag && (event.key === "Escape" || event.key === "Tab")) {
            if (event.key === "Escape") event.preventDefault();
            // The hidden source grip can lose native focus during preview.
            // Restore it before Tab performs its ordinary next-control action.
            cancel();
        }
    });
    listen(window, "blur", () => cancel(false));
    listen(window, "resize", () => cancel(false));
    listen(reducedMotion, "change", () => { if (reducedMotion.matches) stopAnimations(); });
    signal?.addEventListener("abort", destroy, { once: true });
    if (signal?.aborted) destroy();
    return { cancel, destroy };
}
