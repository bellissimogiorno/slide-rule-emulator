/** Execute the real lesson player, animation and workspace with explicit DOM,
 * event and frame inputs. This tests the interaction contract, not native CSS
 * layout or the physical appearance of an animated browser instrument.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { setMaxListeners } from 'node:events';
import { createTutorial } from '#ui/tutorial.js';
import { createTutorialWorkspace } from '#tutorial/workspace.js';
import { TUTORIAL_LESSONS } from '#tutorial/lessons.js';
import { TUTORIAL_SECTIONS } from '#tutorial/course.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';

function harness({ reduced = false, tolerance = .004, beginFailure = false } = {}) {
    let now = 0, nextFrame = 0, state, begins = 0, ends = 0, failedBegin = beginFailure;
    const frames = new Map(), positions = [], focuses = [], layouts = [];
    const original = { slideOffset: -.175, cursor: .825, name: 'Original custom programme' };
    state = original;
    const event = (target, type, properties = {}) => {
        const value = Object.assign(new Event(type, { cancelable: true }), properties);
        target.dispatchEvent(value);
        return value;
    };
    function node() {
        const attributes = new Map(), classes = new Set();
        return Object.assign(new EventTarget(), {
            textContent: '', value: '', hidden: false, disabled: false, dataset: {},
            isConnected: true, children: [],
            classList: {
                add: (...names) => names.forEach(name => classes.add(name)),
                remove: (...names) => names.forEach(name => classes.delete(name)),
                contains: name => classes.has(name),
                toggle(name, force) {
                    const present = force ?? !classes.has(name);
                    if (present) classes.add(name); else classes.delete(name);
                    return present;
                }
            },
            setAttribute: (name, value) => attributes.set(name, String(value)),
            getAttribute: name => attributes.get(name) ?? null,
            removeAttribute: name => attributes.delete(name),
            appendChild(child) { this.children.push(child); return child; },
            replaceChildren(...children) { this.children = children; },
            focus(options) { document.activeElement = this; this.focusOptions = options; },
            scrollIntoView(options) { this.scrollOptions = options; },
            click() { if (!this.disabled) event(this, 'click'); }
        });
    }
    const names = ['Button', 'Panel', 'Heading', 'CloseButton', 'SectionSelect', 'SectionSummary', 'LessonSelect', 'Intro',
        'Summary', 'Problem', 'WatchButton', 'Player', 'Phase', 'StepHeading', 'Instruction',
        'Reading', 'PracticeHelp', 'PauseButton', 'ReplayButton', 'NextButton',
        'TryButton', 'CheckButton', 'PracticeNextButton', 'WatchAgainButton',
        'NextLessonButton', 'FinishButton', 'Feedback', 'Progress', 'SessionProgress', 'MotionNotice'];
    const nodes = Object.fromEntries(names.map(name => [name, node()]));
    nodes.Panel.hidden = true;
    // A configured page may contain the previous session's cloned controls.
    nodes.SectionSelect.appendChild(node()); nodes.LessonSelect.appendChild(node());
    nodes.SectionSelect.value = 'stale'; nodes.LessonSelect.value = 'stale';
    nodes.SessionProgress.textContent = 'Previous session progress';
    nodes.Problem.textContent = 'Previous session problem';
    const media = Object.assign(new EventTarget(), { matches: reduced });
    const window = Object.assign(new EventTarget(), {
        performance: { now: () => now },
        AbortController: class extends AbortController {
            constructor() { super(); setMaxListeners(0, this.signal); }
        },
        matchMedia: () => media,
        requestAnimationFrame(fn) { const id = nextFrame++; frames.set(id, fn); return id; },
        cancelAnimationFrame(id) { frames.delete(id); }
    });
    const document = Object.assign(new EventTarget(), {
        defaultView: window, hidden: false, activeElement: null, body: node(),
        getElementById: id => nodes[id.slice('tutorial'.length)] ?? null,
        createElement: node
    });
    const lifetime = new AbortController();
    const workspace = createTutorialWorkspace({ getState: () => state, setState: value => { state = value; } });
    const controller = createTutorial({ document, signal: lifetime.signal,
        onBegin(position, layout) {
            begins++;
            layouts.push(layout);
            if (!workspace.active) workspace.enter({ ...position, name: 'Temporary tutorial' });
            else Object.assign(state, position);
            if (failedBegin) throw new Error('Training setup failed');
        },
        onPosition(position) { positions.push({ ...position }); Object.assign(state, position); },
        onEnd() { ends++; workspace.leave(); },
        getPosition: () => ({ slideOffset: state.slideOffset, cursor: state.cursor }),
        getTolerance: () => tolerance,
        onFocus: part => focuses.push(part)
    });
    return { controller, document, window, nodes, media, frames, positions, focuses, layouts, workspace, original,
        get state() { return state; }, get begins() { return begins; }, get ends() { return ends; },
        get now() { return now; }, event,
        section(id) { nodes.SectionSelect.value = id; event(nodes.SectionSelect, 'change'); },
        select(index) {
            if (nodes.SectionSelect.value !== TUTORIAL_LESSONS[index].sectionId) {
                nodes.SectionSelect.value = TUTORIAL_LESSONS[index].sectionId;
                event(nodes.SectionSelect, 'change');
            }
            nodes.LessonSelect.value = String(index); event(nodes.LessonSelect, 'change');
        },
        click(name) { nodes[name].click(); },
        forceClick(name) { event(nodes[name], 'click'); },
        move(position, interrupt = true) { if (interrupt) controller.interrupt(); Object.assign(state, position); },
        tick(time) {
            now = time;
            const pending = [...frames.values()]; frames.clear();
            for (const fn of pending) fn(time);
        },
        reduce(value) { media.matches = value; event(media, 'change'); },
        recoverBegin() { failedBegin = false; },
        destroy: () => lifetime.abort()
    };
}

const position = ui => ({ slideOffset: ui.state.slideOffset, cursor: ui.state.cursor });
function watchComplete(ui, lessonIndex) {
    ui.controller.open(); ui.select(lessonIndex);
    const lesson = TUTORIAL_LESSONS[lessonIndex];
    assert.equal(typeof lesson.problem, 'string'); assert.match(lesson.problem, /\S/);
    assert.equal(typeof lesson.practice.problem, 'string'); assert.match(lesson.practice.problem, /\S/);
    assert.equal(ui.nodes.Problem.textContent, lesson.problem);
    assert.equal(ui.nodes.Problem.hidden, false);
    ui.click('WatchButton');
    for (const [index, step] of lesson.steps.entries()) {
        assert.equal(ui.nodes.Problem.textContent, lesson.problem);
        assert.equal(ui.nodes.StepHeading.textContent, step.title);
        ui.tick(ui.now + step.duration);
        assert.deepEqual(position(ui), step.target);
        if (index < lesson.steps.length - 1) ui.click('NextButton');
    }
    return lesson;
}

test('opening introduces lessons without entering training or altering the programme', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.controller.open(); ui.controller.open();
    assert.equal(ui.begins, 0); assert.equal(ui.controller.active, false);
    assert.equal(ui.state, ui.original); assert.equal(ui.frames.size, 0);
    assert.equal(ui.nodes.Panel.hidden, false); assert.equal(ui.nodes.Intro.hidden, false);
    assert.equal(ui.nodes.Player.hidden, true); assert.equal(ui.document.activeElement, ui.nodes.Heading);
    assert.equal(ui.nodes.SectionSelect.children.length, TUTORIAL_SECTIONS.length);
    assert.equal(ui.nodes.LessonSelect.children.length, TUTORIAL_SECTIONS[0].lessons.length);
    assert.equal(ui.nodes.SectionSelect.value, TUTORIAL_SECTIONS[0].id);
    assert.equal(ui.nodes.LessonSelect.value, '0');
    assert.equal(ui.nodes.Problem.textContent, TUTORIAL_LESSONS[0].problem);
    assert.equal(ui.nodes.SessionProgress.textContent, `This session: 0/${TUTORIAL_LESSONS.length} demonstrated · 0/${TUTORIAL_LESSONS.length} practised`);
    assert.equal(ui.nodes.Button.getAttribute('aria-expanded'), 'true');
    ui.click('CloseButton');
    assert.equal(ui.ends, 0); assert.equal(ui.state, ui.original);
    assert.equal(ui.document.activeElement, ui.nodes.Button);
});

test('Watch visibly moves the instrument, waits at narration boundaries and gates Next', t => {
    const ui = harness(); t.after(ui.destroy);
    const lesson = TUTORIAL_LESSONS[0], step = lesson.steps[0];
    ui.controller.open(); ui.click('WatchButton');
    assert.equal(ui.begins, 1); assert.equal(ui.controller.active, true);
    assert.notEqual(ui.state, ui.original); assert.deepEqual(position(ui), lesson.start);
    assert.equal(ui.nodes.Instruction.textContent, step.text);
    assert.equal(ui.document.body.dataset.tutorialFocus, 'cursor');
    assert.equal(ui.nodes.NextButton.disabled, true);
    ui.forceClick('NextButton'); assert.equal(ui.nodes.StepHeading.textContent, step.title);
    ui.tick(step.duration / 2);
    assert.ok(ui.state.cursor > lesson.start.cursor && ui.state.cursor < step.target.cursor);
    assert.equal(ui.nodes.Instruction.textContent, step.text);
    ui.tick(step.duration);
    assert.deepEqual(position(ui), step.target); assert.equal(ui.nodes.NextButton.disabled, false);
    ui.tick(20000);
    assert.equal(ui.nodes.StepHeading.textContent, step.title);
    assert.deepEqual(position(ui), step.target); assert.equal(ui.frames.size, 0);
    ui.click('NextButton'); assert.equal(ui.nodes.StepHeading.textContent, lesson.steps[1].title);
    assert.equal(ui.nodes.Instruction.textContent, lesson.steps[1].text);
});

test('Pause and Resume hold the displayed instrument without losing the narrated step', t => {
    const ui = harness(); t.after(ui.destroy);
    const step = TUTORIAL_LESSONS[0].steps[0];
    ui.controller.open(); ui.click('WatchButton'); ui.tick(400);
    const frozen = position(ui); ui.click('PauseButton');
    assert.equal(ui.nodes.PauseButton.textContent, 'Resume movement'); assert.equal(ui.frames.size, 0);
    ui.tick(10000); assert.deepEqual(position(ui), frozen);
    assert.equal(ui.nodes.Instruction.textContent, step.text);
    ui.click('PauseButton'); ui.tick(10000);
    assert.deepEqual(position(ui), frozen);
    ui.tick(10000 + step.duration - 400);
    assert.deepEqual(position(ui), step.target); assert.equal(ui.nodes.NextButton.disabled, false);
});

test('Replay resets to the beginning of the current movement and replays it', t => {
    const ui = harness(); t.after(ui.destroy);
    const lesson = TUTORIAL_LESSONS[1];
    ui.controller.open(); ui.select(1); ui.click('WatchButton');
    ui.tick(lesson.steps[0].duration); ui.click('NextButton');
    ui.tick(ui.now + 400);
    assert.ok(ui.state.slideOffset > 0 && ui.state.slideOffset < lesson.steps[1].target.slideOffset);
    ui.click('ReplayButton');
    assert.deepEqual(position(ui), lesson.steps[0].target);
    assert.equal(ui.nodes.StepHeading.textContent, lesson.steps[1].title);
    assert.equal(ui.nodes.NextButton.disabled, true);
    ui.tick(ui.now + lesson.steps[1].duration);
    assert.deepEqual(position(ui), lesson.steps[1].target);
});

test('manual manipulation cancels the demonstration until the movement is replayed', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.controller.open(); ui.click('WatchButton');
    const staleFrame = [...ui.frames.values()][0];
    ui.move({ slideOffset: .125, cursor: .875 });
    assert.equal(ui.frames.size, 0); assert.equal(ui.nodes.NextButton.disabled, true);
    assert.match(ui.nodes.Feedback.textContent, /Replay this movement/);
    staleFrame(10000); assert.deepEqual(position(ui), { slideOffset: .125, cursor: .875 });
    ui.click('ReplayButton'); assert.deepEqual(position(ui), TUTORIAL_LESSONS[0].start);
    ui.tick(ui.now + TUTORIAL_LESSONS[0].steps[0].duration);
    assert.deepEqual(position(ui), TUTORIAL_LESSONS[0].steps[0].target);
});

test('choosing another lesson cancels old motion and waits for its explicit Watch action', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.controller.open(); ui.click('WatchButton');
    const stale = [...ui.frames.values()][0]; ui.tick(400);
    const frozen = position(ui); ui.select(2);
    assert.equal(ui.frames.size, 0); assert.equal(ui.nodes.Intro.hidden, false);
    assert.equal(ui.nodes.Player.hidden, true); assert.equal(ui.begins, 1);
    assert.equal(ui.document.body.dataset.tutorialFocus, undefined);
    stale(10000); assert.deepEqual(position(ui), frozen);
    ui.click('WatchButton'); assert.equal(ui.begins, 2);
    assert.deepEqual(position(ui), TUTORIAL_LESSONS[2].start);
    assert.equal(ui.nodes.StepHeading.textContent, TUTORIAL_LESSONS[2].steps[0].title);
});

test('reduced motion shows one exact step per explicit action without an animation loop', t => {
    const ui = harness({ reduced: true }); t.after(ui.destroy);
    const lesson = TUTORIAL_LESSONS[0];
    ui.controller.open(); ui.click('WatchButton');
    assert.deepEqual(position(ui), lesson.steps[0].target);
    assert.equal(ui.frames.size, 0); assert.equal(ui.nodes.MotionNotice.hidden, false);
    assert.equal(ui.nodes.PauseButton.hidden, true); assert.equal(ui.nodes.NextButton.disabled, false);
    ui.tick(10000); assert.equal(ui.nodes.StepHeading.textContent, lesson.steps[0].title);
    ui.click('NextButton'); assert.deepEqual(position(ui), lesson.steps[1].target);
    assert.equal(ui.frames.size, 0); assert.equal(ui.nodes.TryButton.hidden, false);
});

test('blur and hidden pages pause motion; enabling reduced motion completes only the current step', t => {
    const ui = harness(); t.after(ui.destroy);
    const first = TUTORIAL_LESSONS[0].steps[0];
    ui.controller.open(); ui.click('WatchButton'); ui.tick(300);
    ui.event(ui.window, 'blur'); const frozen = position(ui);
    ui.tick(5000); assert.deepEqual(position(ui), frozen);
    assert.equal(ui.nodes.PauseButton.textContent, 'Resume movement');
    ui.click('PauseButton'); ui.tick(5200);
    ui.document.hidden = true; ui.event(ui.document, 'visibilitychange');
    const hidden = position(ui); ui.tick(9000); assert.deepEqual(position(ui), hidden);
    ui.document.hidden = false; ui.event(ui.document, 'visibilitychange');
    assert.equal(ui.frames.size, 0);
    ui.reduce(true);
    assert.deepEqual(position(ui), first.target); assert.equal(ui.frames.size, 0);
    assert.equal(ui.nodes.StepHeading.textContent, first.title);
    assert.equal(ui.nodes.NextButton.disabled, false); assert.equal(ui.nodes.MotionNotice.hidden, false);
});

for (const [lessonIndex, lesson] of TUTORIAL_LESSONS.entries())
    test(`${lesson.title}: demonstration and optional imitation run through real position checks`, t => {
        const ui = harness(); t.after(ui.destroy);
        watchComplete(ui, lessonIndex);
        assert.equal(ui.layouts.at(-1), lesson.layout);
        assert.equal(ui.nodes.TryButton.hidden, false);
        assert.equal(ui.nodes.FinishButton.hidden, false);
        ui.click('TryButton');
        assert.equal(ui.layouts.at(-1), lesson.layout);
        assert.equal(ui.nodes.Problem.textContent, lesson.practice.problem);
        assert.equal(ui.nodes.Problem.hidden, false);
        assert.deepEqual(position(ui), lesson.practice.start);
        assert.equal(ui.nodes.PracticeHelp.hidden, false);
        assert.match(ui.nodes.Phase.textContent, /Your turn/);
        for (const [index, step] of lesson.practice.steps.entries()) {
            assert.equal(ui.nodes.Problem.textContent, lesson.practice.problem);
            assert.equal(ui.nodes.StepHeading.textContent, step.title);
            const wrong = { ...step.target };
            const field = step.required[0]; wrong[field] += .02;
            ui.move(wrong); ui.click('CheckButton');
            assert.equal(ui.nodes.Feedback.dataset.result, 'retry');
            assert.equal(ui.nodes.PracticeNextButton.disabled, true);
            ui.move(step.target); ui.click('CheckButton');
            assert.equal(ui.nodes.Feedback.dataset.result, 'success');
            assert.equal(ui.nodes.Feedback.textContent, step.success);
            if (index < lesson.practice.steps.length - 1) ui.click('PracticeNextButton');
        }
        ui.click('FinishButton');
        assert.equal(ui.state, ui.original); assert.equal(ui.ends, 1);
        assert.equal(ui.controller.active, false); assert.equal(ui.controller.opened, false);
        assert.equal(ui.document.body.classList.contains('tutorial-active'), false);
    });

test('division practice selects the slide while preserving the marked dividend at its second step', t => {
    const ui = harness(); t.after(ui.destroy);
    const lesson = watchComplete(ui, 2);
    ui.click('TryButton'); ui.move(lesson.practice.steps[0].target); ui.click('CheckButton');
    ui.click('PracticeNextButton');
    assert.equal(ui.document.body.dataset.tutorialFocus, 'slide');
    assert.equal(ui.focuses.at(-1), 'slide');
    assert.equal(ui.state.cursor, Math.log10(6));
    assert.equal(ui.nodes.StepHeading.textContent, 'Align the divisor');
});

test('practice success is rechecked before advancing or finishing, even without a movement notification', t => {
    const ui = harness(); t.after(ui.destroy);
    const lesson = watchComplete(ui, 1); ui.click('TryButton');
    const first = lesson.practice.steps[0];
    ui.move(first.target); ui.click('CheckButton'); assert.equal(ui.nodes.Feedback.dataset.result, 'success');
    ui.move({ slideOffset: first.target.slideOffset + .1 }, false);
    ui.forceClick('PracticeNextButton');
    assert.equal(ui.nodes.StepHeading.textContent, first.title);
    assert.equal(ui.nodes.Feedback.dataset.result, 'retry');
    ui.move(first.target); ui.click('CheckButton'); ui.click('PracticeNextButton');
    const last = lesson.practice.steps.at(-1);
    ui.move(last.target); ui.click('CheckButton');
    ui.move({ cursor: last.target.cursor - .1 }, false); ui.forceClick('FinishButton');
    assert.equal(ui.controller.active, true); assert.equal(ui.ends, 0);
    assert.equal(ui.nodes.Feedback.dataset.result, 'retry');
    ui.move(last.target); ui.click('CheckButton'); ui.click('FinishButton');
    assert.equal(ui.ends, 1); assert.equal(ui.state, ui.original);
});

test('manual practice movement clears an earlier pass and the supplied reading tolerance is used', t => {
    const ui = harness({ tolerance: .01 }); t.after(ui.destroy);
    const lesson = watchComplete(ui, 1); ui.click('TryButton');
    ui.move({ ...lesson.practice.steps[0].target, slideOffset: lesson.practice.steps[0].target.slideOffset + .007 });
    ui.click('CheckButton'); assert.equal(ui.nodes.Feedback.dataset.result, 'success');
    ui.controller.interrupt();
    assert.equal(ui.nodes.Feedback.textContent, ''); assert.equal(ui.nodes.PracticeNextButton.disabled, true);
});

test('practice can be skipped after watching and Next lesson still waits for Watch', t => {
    const ui = harness(); t.after(ui.destroy);
    watchComplete(ui, 0);
    assert.equal(ui.nodes.NextLessonButton.hidden, false);
    ui.click('NextLessonButton');
    assert.equal(ui.nodes.Intro.hidden, false); assert.equal(ui.nodes.LessonSelect.value, '1');
    assert.equal(ui.begins, 1); assert.equal(ui.frames.size, 0);
    ui.click('WatchButton'); assert.equal(ui.begins, 2);
    ui.click('CloseButton'); assert.equal(ui.state, ui.original);
});

test('Escape and repeated closing restore once, cancel frames and return focus', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.controller.open(); ui.click('WatchButton');
    const stale = [...ui.frames.values()][0];
    const escape = ui.event(ui.nodes.Panel, 'keydown', { key: 'Escape', isComposing: false });
    assert.equal(escape.defaultPrevented, true); assert.equal(ui.state, ui.original);
    assert.equal(ui.ends, 1); assert.equal(ui.nodes.Panel.hidden, true);
    assert.equal(ui.nodes.Button.getAttribute('aria-expanded'), 'false');
    assert.equal(ui.document.activeElement, ui.nodes.Button);
    stale(10000); ui.controller.close();
    assert.equal(ui.ends, 1); assert.equal(ui.frames.size, 0); assert.equal(ui.state, ui.original);
});

test('failed first entry rolls back a partly created workspace and remains recoverable', t => {
    const ui = harness({ beginFailure: true }); t.after(ui.destroy);
    ui.controller.open(); ui.click('WatchButton');
    assert.equal(ui.state, ui.original); assert.equal(ui.workspace.active, false);
    assert.equal(ui.ends, 1); assert.equal(ui.controller.active, false);
    assert.equal(ui.document.body.classList.contains('tutorial-active'), false);
    assert.equal(ui.nodes.Intro.hidden, false); assert.equal(ui.frames.size, 0);
    assert.match(ui.nodes.Feedback.textContent, /lesson could not start/);
    ui.recoverBegin(); ui.click('WatchButton'); assert.equal(ui.controller.active, true);
    ui.click('CloseButton'); assert.equal(ui.state, ui.original); assert.equal(ui.ends, 2);
});

test('teardown removes event listeners and stale callbacks cannot reopen or move the instrument', () => {
    const ui = harness(); ui.controller.open(); ui.click('WatchButton');
    const stale = [...ui.frames.values()][0]; ui.destroy();
    assert.equal(ui.state, ui.original); assert.equal(ui.ends, 1); assert.equal(ui.frames.size, 0);
    ui.click('Button'); ui.click('WatchButton'); ui.reduce(true); ui.controller.open(); stale(10000);
    assert.equal(ui.begins, 1); assert.equal(ui.ends, 1); assert.equal(ui.controller.opened, false);
    assert.equal(ui.controller.active, false); assert.equal(ui.state, ui.original);
});

test('repeated sessions retain one set of controls and event handlers', t => {
    const ui = harness({ reduced: true }); t.after(ui.destroy);
    for (let i = 0; i < 4; i++) {
        ui.click('Button'); ui.click('WatchButton'); ui.click('CloseButton');
        assert.equal(ui.begins, i + 1); assert.equal(ui.ends, i + 1);
        assert.equal(ui.state, ui.original);
    }
    assert.equal(ui.nodes.SectionSelect.children.length, TUTORIAL_SECTIONS.length);
    assert.equal(ui.nodes.LessonSelect.children.length, TUTORIAL_SECTIONS[0].lessons.length);
});

test('section changes cancel motion, show only their lessons with global values and wait for Watch', t => {
    const ui = harness(); t.after(ui.destroy);
    ui.controller.open(); ui.click('WatchButton'); ui.tick(300);
    const frozen = position(ui), stale = [...ui.frames.values()][0];
    const section = TUTORIAL_SECTIONS.find(item => item.id === 'powers');
    const first = TUTORIAL_LESSONS.findIndex(item => item.sectionId === section.id);
    ui.document.activeElement = ui.nodes.SectionSelect;
    ui.section(section.id);
    assert.equal(ui.frames.size, 0); assert.equal(ui.begins, 1);
    assert.equal(ui.nodes.Intro.hidden, false); assert.equal(ui.nodes.Player.hidden, true);
    assert.equal(ui.nodes.LessonSelect.value, String(first));
    assert.deepEqual(ui.nodes.LessonSelect.children.map(option => Number(option.value)),
        TUTORIAL_LESSONS.flatMap((item, index) => item.sectionId === section.id ? [index] : []));
    assert.equal(ui.nodes.SectionSummary.textContent, section.summary);
    assert.equal(ui.nodes.Problem.textContent, TUTORIAL_LESSONS[first].problem);
    assert.equal(ui.document.activeElement, ui.nodes.SectionSelect);
    stale(10000); assert.deepEqual(position(ui), frozen);
    // Values belonging to another section cannot bypass the lesson chooser.
    ui.nodes.LessonSelect.value = '0'; ui.event(ui.nodes.LessonSelect, 'change');
    ui.click('WatchButton');
    assert.equal(ui.layouts.at(-1), TUTORIAL_LESSONS[first].layout);
    assert.equal(ui.nodes.StepHeading.textContent, TUTORIAL_LESSONS[first].steps[0].title);
});

test('Next section introduces the next section without starting it or losing progress', t => {
    const ui = harness({ reduced: true }); t.after(ui.destroy);
    const boundary = TUTORIAL_SECTIONS[0].lessons.length - 1;
    watchComplete(ui, boundary);
    assert.equal(ui.nodes.NextLessonButton.textContent, 'Next section');
    assert.equal(ui.nodes.NextLessonButton.hidden, false);
    ui.click('NextLessonButton');
    assert.equal(ui.nodes.SectionSelect.value, TUTORIAL_SECTIONS[1].id);
    assert.equal(ui.nodes.LessonSelect.value, String(boundary + 1));
    assert.equal(ui.nodes.Intro.hidden, false); assert.equal(ui.begins, 1);
    assert.equal(ui.document.activeElement, ui.nodes.WatchButton);
    assert.match(ui.nodes.SessionProgress.textContent, /^This session: 1\//);
});

test('session progress distinguishes watching from final practice and updates options without moving focus', t => {
    const ui = harness({ reduced: true }); t.after(ui.destroy);
    const lesson = watchComplete(ui, 0), option = ui.nodes.LessonSelect.children[0];
    assert.match(option.textContent, / — demonstrated$/);
    ui.click('ReplayButton');
    assert.match(ui.nodes.SessionProgress.textContent, /^This session: 1\/.* · 0\//);
    ui.click('TryButton');
    for (const [index, step] of lesson.practice.steps.entries()) {
        ui.move(step.target); ui.document.activeElement = ui.nodes.CheckButton; ui.click('CheckButton');
        assert.equal(ui.document.activeElement, ui.nodes.CheckButton);
        assert.equal(ui.nodes.LessonSelect.children[0], option);
        assert.equal(ui.nodes.LessonSelect.value, '0');
        if (index < lesson.practice.steps.length - 1) {
            assert.match(ui.nodes.SessionProgress.textContent, / · 0\//);
            ui.click('PracticeNextButton');
        }
    }
    assert.match(ui.nodes.SessionProgress.textContent, /^This session: 1\/.* · 1\//);
    assert.match(option.textContent, / — practised$/);
    ui.click('CheckButton'); assert.match(ui.nodes.SessionProgress.textContent, / · 1\//);
    ui.click('CloseButton'); ui.controller.open();
    assert.match(ui.nodes.SessionProgress.textContent, /^This session: 1\/.* · 1\//);
});

test('reading hints name each lesson’s authored scales, including non-C/D layouts', t => {
    const ui = harness({ reduced: true }); t.after(ui.destroy);
    for (const [index, lesson] of TUTORIAL_LESSONS.entries()) {
        ui.controller.open(); ui.select(index); ui.click('WatchButton');
        for (const [stepIndex, step] of lesson.steps.entries()) {
            for (const id of step.readings) assert.ok(ui.nodes.Reading.textContent.includes(BUILTIN_SCALES[id]?.label || id));
            if (stepIndex < lesson.steps.length - 1) ui.click('NextButton');
        }
    }
});

test('problem switches with demonstration and practice, survives replay, and resets on another lesson', t => {
    const ui = harness({ reduced: true }); t.after(ui.destroy);
    const index = TUTORIAL_LESSONS.findIndex(item => item.problem !== item.practice.problem);
    assert(index >= 0, 'The course includes practice with a different problem');
    const lesson = watchComplete(ui, index);
    ui.click('ReplayButton'); assert.equal(ui.nodes.Problem.textContent, lesson.problem);
    ui.click('TryButton'); assert.equal(ui.nodes.Problem.textContent, lesson.practice.problem);
    ui.click('WatchAgainButton'); assert.equal(ui.nodes.Problem.textContent, lesson.problem);
    ui.select(0); assert.equal(ui.nodes.Problem.textContent, TUTORIAL_LESSONS[0].problem);
    assert.equal(ui.nodes.Intro.hidden, false);
    ui.click('CloseButton'); assert.equal(ui.nodes.Problem.textContent, TUTORIAL_LESSONS[0].problem);
    assert.equal(ui.state, ui.original);
});
