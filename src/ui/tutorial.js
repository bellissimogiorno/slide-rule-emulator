/** A narrated lesson player over the application's actual instrument.
 * Lesson data and animation stay independent; the application owns temporary
 * programme isolation, physical rendering, persistence and original-work restore.
 * No animation frame changes tutorial prose or announces repeated readings.
 */
import { TUTORIAL_LESSONS, checkTutorialAlignment } from '#tutorial/lessons.js';
import { TUTORIAL_SECTIONS } from '#tutorial/course.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { createTutorialAnimation } from '#tutorial/animation.js';

export function createTutorial({ document, signal, onBegin, onPosition, onEnd,
    getPosition, getTolerance = () => .004, onFocus = () => {} }) {
    const window = document.defaultView;
    const lifetime = new window.AbortController();
    const ids = ['Button', 'Panel', 'Heading', 'CloseButton', 'SectionSelect', 'SectionSummary', 'LessonSelect', 'Intro',
        'Summary', 'Problem', 'WatchButton', 'Player', 'Phase', 'StepHeading', 'Instruction',
        'Reading', 'PracticeHelp', 'PauseButton', 'ReplayButton', 'NextButton',
        'TryButton', 'CheckButton', 'PracticeNextButton', 'WatchAgainButton',
        'NextLessonButton', 'FinishButton', 'Feedback', 'Progress', 'SessionProgress', 'MotionNotice'];
    const dom = Object.fromEntries(ids.map(name => [name, document.getElementById('tutorial' + name)]));
    if (ids.some(name => !dom[name])) throw new Error('The tutorial interface is incomplete.');
    dom.Panel.hidden = true;
    dom.Button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('tutorial-active');
    delete document.body.dataset.tutorialFocus;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let opened = false, active = false, destroyed = false;
    let lessonIndex = 0, stepIndex = 0, phase = 'intro';
    let movementComplete = false, interrupted = false, checked = false;
    let renderedSection;
    const demonstrated = new Set(), practised = new Set();
    const listen = (target, name, handler) =>
        target.addEventListener(name, handler, { signal: lifetime.signal });
    const lesson = () => TUTORIAL_LESSONS[lessonIndex];
    const section = () => TUTORIAL_SECTIONS.find(item => item.id === lesson().sectionId);
    const currentStep = () => phase === 'practice' ? lesson().practice.steps[stepIndex] : lesson().steps[stepIndex];
    const animation = createTutorialAnimation({ clock: window,
        onPosition: position => { if (active && !destroyed) onPosition(position); },
        onComplete: () => {
            if (destroyed || !active || phase !== 'demo') return;
            movementComplete = true;
            interrupted = false;
            if (stepIndex === lesson().steps.length - 1) demonstrated.add(lessonIndex);
            feedback('Movement complete. Read the rule, then continue.');
            render();
        }
    });

    dom.SectionSelect.replaceChildren();
    for (const [index, item] of TUTORIAL_SECTIONS.entries()) {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${index + 1}. ${item.title}`;
        dom.SectionSelect.appendChild(option);
    }
    function lessonChoices(currentSection) {
        if (renderedSection !== currentSection.id) {
            dom.LessonSelect.replaceChildren();
            for (const [index, item] of TUTORIAL_LESSONS.entries()) {
                if (item.sectionId !== currentSection.id) continue;
                const option = document.createElement('option');
                option.value = String(index);
                dom.LessonSelect.appendChild(option);
            }
            renderedSection = currentSection.id;
        }
        for (const option of dom.LessonSelect.children) {
            const index = Number(option.value), item = TUTORIAL_LESSONS[index];
            const status = practised.has(index) ? ' — practised' : demonstrated.has(index) ? ' — demonstrated' : '';
            option.textContent = `${index + 1}. ${item.title}${status}`;
        }
        dom.LessonSelect.value = String(lessonIndex);
    }
    function feedback(text = '', result = '') {
        dom.Feedback.textContent = text;
        dom.Feedback.dataset.result = result;
    }
    function focusPart(part) {
        if (part) document.body.dataset.tutorialFocus = part;
        else delete document.body.dataset.tutorialFocus;
        onFocus(part);
    }
    function restoreWorkspace(restore = active) {
        document.body.classList.remove('tutorial-active');
        delete document.body.dataset.tutorialFocus;
        try { onFocus(null); }
        finally { if (restore) onEnd(); }
    }
    function render() {
        const item = lesson(), currentSection = section();
        const sectionIndex = TUTORIAL_SECTIONS.indexOf(currentSection);
        const localIndex = currentSection.lessons.indexOf(item);
        dom.SectionSelect.value = currentSection.id;
        lessonChoices(currentSection);
        dom.SectionSummary.textContent = currentSection.summary;
        dom.Summary.textContent = item.summary;
        dom.Problem.textContent = phase === 'practice' ? item.practice.problem : item.problem;
        dom.Progress.textContent = `Section ${sectionIndex + 1} of ${TUTORIAL_SECTIONS.length} · Lesson ${localIndex + 1} of ${currentSection.lessons.length}`;
        dom.SessionProgress.textContent = `This session: ${demonstrated.size}/${TUTORIAL_LESSONS.length} demonstrated · ${practised.size}/${TUTORIAL_LESSONS.length} practised`;
        dom.Intro.hidden = phase !== 'intro';
        dom.Player.hidden = phase === 'intro';
        dom.MotionNotice.hidden = !reducedMotion.matches;
        const demo = phase === 'demo', practice = phase === 'practice';
        const last = stepIndex === (practice ? item.practice.steps.length : item.steps.length) - 1;
        const success = practice && checked;
        const finished = last && ((demo && movementComplete) || success);
        dom.PauseButton.hidden = !demo || (!animation.playing && !animation.paused);
        dom.PauseButton.textContent = animation.paused ? 'Resume movement' : 'Pause movement';
        dom.ReplayButton.hidden = !demo;
        dom.NextButton.hidden = !demo || last;
        dom.NextButton.disabled = !movementComplete;
        dom.TryButton.hidden = !demo || !last || !movementComplete;
        dom.CheckButton.hidden = !practice;
        dom.PracticeNextButton.hidden = !practice || last;
        dom.PracticeNextButton.disabled = !success;
        dom.WatchAgainButton.hidden = !practice;
        dom.NextLessonButton.hidden = !finished || lessonIndex === TUTORIAL_LESSONS.length - 1;
        dom.NextLessonButton.textContent = TUTORIAL_LESSONS[lessonIndex + 1]?.sectionId !== item.sectionId
            ? 'Next section' : 'Next lesson';
        dom.NextLessonButton.classList.toggle('primary', practice);
        dom.FinishButton.hidden = !finished;
        dom.FinishButton.classList.toggle('primary', practice && lessonIndex === TUTORIAL_LESSONS.length - 1);
        if (phase === 'intro') return;
        const step = currentStep();
        const total = practice ? item.practice.steps.length : item.steps.length;
        dom.Phase.textContent = `${practice ? 'Your turn' : 'Watch'} · Step ${stepIndex + 1} of ${total}`;
        dom.StepHeading.textContent = step.title;
        dom.Instruction.textContent = step.text;
        const scales = (step.readings || []).map(id => BUILTIN_SCALES[id]?.label || id).join(' and ');
        const reading = scales ? `Read ${scales} below.` : 'Read the rule below.';
        dom.Reading.textContent = practice ? 'Move the rule below, then check your alignment.'
            : `${step.focus === 'cursor' ? 'Watch the highlighted cursor.' : step.focus === 'slide' ? 'Watch the highlighted slide.' : 'Watch the highlighted scales.'} ${reading}`;
        dom.PracticeHelp.hidden = !practice;
        dom.PracticeHelp.textContent = practice ? [item.practice.intro, item.practice.note].filter(Boolean).join(' ') : '';
    }
    function begin(position) {
        // The larger lesson engraving must apply before the application measures
        // its teaching face. Persistence isolation is owned by onBegin.
        document.body.classList.add('tutorial-active');
        try { onBegin({ ...position }, lesson().layout); }
        catch (error) {
            animation.cancel();
            // Entry may fail after the application's temporary workspace was
            // created. Always request restoration, including first entry.
            try { restoreWorkspace(true); }
            catch (restoreError) { error = restoreError; }
            active = false;
            phase = 'intro';
            stepIndex = 0;
            movementComplete = interrupted = checked = false;
            feedback(`The lesson could not start. ${error.message || String(error)}`, 'retry');
            render();
            return false;
        }
        active = true;
        return true;
    }
    function playStep(index) {
        animation.cancel();
        phase = 'demo';
        stepIndex = index;
        movementComplete = false;
        interrupted = false;
        checked = false;
        feedback();
        const item = lesson(), step = item.steps[index];
        const from = index ? item.steps[index - 1].target : item.start;
        focusPart(step.focus);
        render();
        dom.StepHeading.focus({ preventScroll: true });
        animation.play(from, step.target, reducedMotion.matches ? 0 : step.duration);
        render();
    }
    function watch() {
        if (destroyed || !opened) return;
        animation.cancel();
        if (!begin(lesson().start)) return;
        playStep(0);
    }
    function introduce(index, { focus = false } = {}) {
        animation.cancel();
        lessonIndex = index;
        phase = 'intro';
        stepIndex = 0;
        movementComplete = interrupted = checked = false;
        feedback();
        focusPart(null);
        render();
        if (opened && focus) dom.WatchButton.focus({ preventScroll: true });
    }
    function open() {
        if (destroyed) return;
        if (!opened) {
            opened = true;
            dom.Panel.hidden = false;
            dom.Button.setAttribute('aria-expanded', 'true');
            introduce(lessonIndex);
        }
        dom.Heading.focus({ preventScroll: true });
        dom.Panel.scrollIntoView?.({ block: 'start' });
    }
    function close({ restoreFocus = true } = {}) {
        if (!opened && !active) return;
        animation.cancel();
        try { restoreWorkspace(); }
        finally {
            active = false;
            opened = false;
            phase = 'intro';
            checked = movementComplete = interrupted = false;
            dom.Panel.hidden = true;
            dom.Button.setAttribute('aria-expanded', 'false');
            feedback();
            render();
            if (restoreFocus && dom.Button.isConnected) dom.Button.focus({ preventScroll: true });
        }
    }
    function interrupt() {
        if (!active) return;
        if (phase === 'practice') {
            if (checked) { checked = false; feedback(); render(); }
            return;
        }
        if (phase !== 'demo' || interrupted) return;
        animation.cancel();
        movementComplete = false;
        interrupted = true;
        feedback('You are moving the rule. Replay this movement to continue the demonstration.');
        render();
    }
    function practice() {
        if (!active || phase !== 'demo' || !movementComplete || stepIndex !== lesson().steps.length - 1) return;
        animation.cancel();
        if (!begin(lesson().practice.start)) return;
        phase = 'practice';
        stepIndex = 0;
        checked = false;
        feedback();
        focusPartForPractice();
        render();
        dom.StepHeading.focus({ preventScroll: true });
    }
    function focusPartForPractice() {
        const step = currentStep(), required = step.required;
        focusPart(step.focus || (required.length > 1 ? 'scales' : required[0] === 'cursor' ? 'cursor' : 'slide'));
    }
    function check() {
        if (!active || phase !== 'practice') return false;
        const result = checkTutorialAlignment(getPosition(), currentStep(), getTolerance());
        checked = result.passed;
        if (checked && stepIndex === lesson().practice.steps.length - 1) practised.add(lessonIndex);
        if (result.passed) feedback(currentStep().success, 'success');
        else {
            const part = result.misses.length > 1 ? 'slide and cursor' : result.misses[0] === 'cursor' ? 'cursor' : 'slide';
            feedback(`Adjust the ${part} to the marks named above, then check again.`, 'retry');
        }
        render();
        return checked;
    }
    function pause() {
        if (!animation.playing) return;
        animation.pause();
        feedback('Movement paused. Resume it when you are ready.');
        render();
    }
    listen(dom.Button, 'click', () => opened ? close() : open());
    listen(dom.CloseButton, 'click', () => close());
    listen(dom.WatchButton, 'click', watch);
    listen(dom.WatchAgainButton, 'click', watch);
    listen(dom.SectionSelect, 'change', () => {
        const index = TUTORIAL_LESSONS.findIndex(item => item.sectionId === dom.SectionSelect.value);
        if (index >= 0) introduce(index);
    });
    listen(dom.LessonSelect, 'change', () => {
        const index = Number(dom.LessonSelect.value);
        if (Number.isInteger(index) && TUTORIAL_LESSONS[index]?.sectionId === section().id) introduce(index);
    });
    listen(dom.ReplayButton, 'click', () => { if (active && phase === 'demo') playStep(stepIndex); });
    listen(dom.NextButton, 'click', () => {
        if (active && phase === 'demo' && movementComplete && stepIndex < lesson().steps.length - 1) playStep(stepIndex + 1);
    });
    listen(dom.PauseButton, 'click', () => {
        if (animation.paused) { feedback(); animation.resume(); render(); }
        else pause();
    });
    listen(dom.TryButton, 'click', practice);
    listen(dom.CheckButton, 'click', check);
    listen(dom.PracticeNextButton, 'click', () => {
        if (checked && check() && stepIndex < lesson().practice.steps.length - 1) {
            stepIndex++;
            checked = false;
            feedback();
            focusPartForPractice();
            render();
            dom.StepHeading.focus({ preventScroll: true });
        }
    });
    listen(dom.NextLessonButton, 'click', () => {
        const finished = phase === 'demo' ? movementComplete && stepIndex === lesson().steps.length - 1 : checked && check();
        if (finished && lessonIndex < TUTORIAL_LESSONS.length - 1) introduce(lessonIndex + 1, { focus: true });
    });
    listen(dom.FinishButton, 'click', () => {
        const finished = phase === 'demo' ? movementComplete && stepIndex === lesson().steps.length - 1 : checked && check();
        if (finished) close();
    });
    listen(dom.Panel, 'keydown', event => {
        if (event.key === 'Escape' && !event.isComposing && !event.defaultPrevented) {
            event.preventDefault();
            event.stopPropagation();
            close();
        }
    });
    listen(window, 'blur', pause);
    listen(document, 'visibilitychange', () => { if (document.hidden) pause(); });
    listen(reducedMotion, 'change', () => {
        if (reducedMotion.matches && (animation.playing || animation.paused)) animation.finish();
        render();
    });
    function destroy() {
        if (destroyed) return;
        try { close({ restoreFocus: false }); }
        finally {
            destroyed = true;
            animation.destroy();
            lifetime.abort();
        }
    }
    signal?.addEventListener('abort', destroy, { once: true });
    if (signal?.aborted) destroy();
    else render();
    return { open, close, interrupt, destroy,
        get active() { return active; }, get opened() { return opened; } };
}
