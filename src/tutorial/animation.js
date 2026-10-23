/** One narrated movement at a time, with an explicit clock for deterministic
 * tests. Positions are fractions of the graduated length, never screen pixels.
 * Pause freezes the last painted frame; resume spends only the remaining time.
 * A cancelled/replaced movement cannot complete, even if its old frame fires.
 */
export function createTutorialAnimation({ clock, onPosition, onComplete = () => {} }) {
    if (!clock || typeof clock.requestAnimationFrame !== 'function' ||
        typeof clock.cancelAnimationFrame !== 'function' || typeof clock.performance?.now !== 'function')
        throw new TypeError('Tutorial animation needs an animation-frame clock.');
    if (typeof onPosition !== 'function' || typeof onComplete !== 'function')
        throw new TypeError('Tutorial animation callbacks must be functions.');

    let movement = null, frame = null, generation = 0, destroyed = false;
    const now = () => {
        const value = clock.performance.now();
        if (!Number.isFinite(value)) throw new RangeError('Tutorial animation clock must be finite.');
        return value;
    };
    function position(value) {
        const { slideOffset, cursor } = value || {};
        if (!Number.isFinite(slideOffset) || slideOffset < -.9 || slideOffset > .9 ||
            !Number.isFinite(cursor) || cursor < 0 || cursor > 1)
            throw new RangeError('Tutorial position is outside the slide or cursor limits.');
        return { slideOffset, cursor };
    }
    function cancelFrame() {
        if (frame !== null) clock.cancelAnimationFrame(frame);
        frame = null;
    }
    function cancel() {
        cancelFrame();
        generation++;
        movement = null;
    }
    function emit(value) {
        try { onPosition({ ...value }); }
        catch (error) { cancel(); throw error; }
    }
    function complete(current, token) {
        movement = null;
        emit(current.target);
        if (generation === token && !destroyed) onComplete();
    }
    function schedule(current, token) {
        if (destroyed || movement !== current || current.paused || generation !== token) return;
        frame = clock.requestAnimationFrame(timestamp => {
            if (destroyed || movement !== current || current.paused || generation !== token) return;
            frame = null;
            const time = Number.isFinite(timestamp) ? timestamp : now();
            current.elapsed = Math.min(current.duration, Math.max(current.elapsed, time - current.start));
            if (current.elapsed === current.duration) { complete(current, token); return; }
            const fraction = current.elapsed / current.duration;
            const eased = fraction * fraction * (3 - 2 * fraction);
            emit({
                slideOffset: current.from.slideOffset + (current.target.slideOffset - current.from.slideOffset) * eased,
                cursor: current.from.cursor + (current.target.cursor - current.from.cursor) * eased
            });
            schedule(current, token);
        });
    }
    function play(from, target, duration) {
        if (destroyed) throw new Error('Tutorial animation has been destroyed.');
        const startPosition = position(from), endPosition = position(target);
        if (!Number.isFinite(duration) || duration < 0)
            throw new RangeError('Tutorial movement duration must be finite and nonnegative.');
        const start = now();
        cancel();
        const current = movement = { from: startPosition, target: endPosition,
            duration, start, elapsed: 0, paused: false };
        const token = generation;
        if (duration === 0) { complete(current, token); return; }
        emit(current.from);
        schedule(current, token);
    }
    function pause() {
        if (!movement || movement.paused) return;
        cancelFrame();
        generation++;
        movement.paused = true;
    }
    function resume() {
        if (!movement?.paused || destroyed) return;
        const start = now() - movement.elapsed;
        movement.start = start;
        movement.paused = false;
        generation++;
        schedule(movement, generation);
    }
    function finish() {
        if (!movement) return;
        const current = movement;
        cancelFrame();
        const token = ++generation;
        complete(current, token);
    }
    function destroy() {
        cancel();
        destroyed = true;
    }
    return { play, pause, resume, finish, cancel, destroy,
        get playing() { return movement !== null && !movement.paused; },
        get paused() { return movement?.paused === true; } };
}
