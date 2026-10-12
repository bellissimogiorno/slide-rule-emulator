/** A deliberately small mathematical language, not a JavaScript sandbox.
 *  No eval, property access, assignments, strings, statements or user functions.
 *  The Math. prefix is accepted for compatibility with existing programmes.
 */
const MathExpressions = (() => {
    const constants = Object.freeze({
        PI: Math.PI, E: Math.E, LN10: Math.LN10, LN2: Math.LN2,
        LOG10E: Math.LOG10E, LOG2E: Math.LOG2E, SQRT2: Math.SQRT2, SQRT1_2: Math.SQRT1_2
    });
    const functions = Object.freeze(Object.fromEntries([
        'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atanh', 'ceil', 'cos',
        'cosh', 'exp', 'expm1', 'floor', 'log', 'log10', 'log1p', 'log2', 'round',
        'sign', 'sin', 'sinh', 'sqrt', 'cbrt', 'tan', 'tanh', 'trunc', 'pow', 'atan2',
        'min', 'max', 'hypot'
    ].map(name => [name, Math[name]])));
    // A null-prototype table cannot mistake inherited names (e.g. constructor)
    // for operators. Build once, not on every iteration of the parser.
    const precedence = Object.freeze(Object.assign(Object.create(null), {
        '+': 10, '-': 10, '*': 20, '/': 20, '%': 20, '**': 30, '^': 30
    }));
    const cache = new Map();
    function compile(source, variable) {
        if (typeof source !== 'string' || !source.trim() || source.length > 1024)
            throw new Error('An expression must contain 1 to 1024 characters.');
        if (!['x', 'p'].includes(variable))
            throw new Error('Unknown expression variable.');
        const cacheKey = variable + ':' + source;
        if (cache.has(cacheKey))
            return cache.get(cacheKey);
        const tokens = [];
        let remaining = source;
        while (remaining.length) {
            const space = remaining.match(/^\s+/);
            if (space) {
                remaining = remaining.slice(space[0].length);
                continue;
            }
            const match = remaining.match(/^(?:(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z_0-9]*(?:\.[A-Za-z_][A-Za-z_0-9]*)?|\*\*|[+*/%(),^\-])/);
            if (!match)
                throw new Error('Unsupported expression syntax near: ' + remaining.slice(0, 24));
            tokens.push(match[0]);
            remaining = remaining.slice(match[0].length);
            if (tokens.length > 256)
                throw new Error('Expression has too many terms (maximum 256).');
        }
        let index = 0;
        function expect(token) {
            if (tokens[index++] !== token)
                throw new Error('Expected ' + token + ' in expression.');
        }
        function parse(minimum = 0, depth = 0) {
            if (depth > 48)
                throw new Error('Expression is nested too deeply.');
            const token = tokens[index++];
            let left;
            if (token === '+' || token === '-') {
                const child = parse(25, depth + 1);
                left = token === '-' ? v => -child(v) : child;
            }
            else if (token === '(') {
                left = parse(0, depth + 1);
                expect(')');
            }
            else if (token && /^(?:\d|\.)/.test(token)) {
                const number = Number(token);
                if (!Number.isFinite(number))
                    throw new Error('Expression contains a non-finite number.');
                left = () => number;
            }
            else if (token === variable) {
                left = v => v;
            }
            else {
                const name = (token || '').replace(/^Math\./, '');
                if (Object.hasOwn(constants, name)) {
                    const value = constants[name];
                    left = () => value;
                }
                else if (Object.hasOwn(functions, name)) {
                    expect('(');
                    const args = [];
                    if (tokens[index] !== ')') {
                        do {
                            if (args.length)
                                expect(',');
                            args.push(parse(0, depth + 1));
                        } while (tokens[index] === ',');
                    }
                    expect(')');
                    const count = ['pow', 'atan2'].includes(name) ? 2 : 1;
                    const variadic = ['min', 'max', 'hypot'].includes(name);
                    if (variadic ? args.length < 1 || args.length > 8 : args.length !== count)
                        throw new Error('Wrong number of arguments to ' + name + '.');
                    left = v => functions[name](...args.map(arg => arg(v)));
                }
                else
                    throw new Error('Unknown name in expression: ' + (token || '(end)'));
            }
            while (index < tokens.length) {
                const operator = tokens[index];
                const binding = precedence[operator];
                if (binding === undefined || binding < minimum)
                    break;
                index++;
                const right = parse(binding + (binding === 30 ? 0 : 1), depth + 1);
                const a = left;
                if (operator === '+')
                    left = v => a(v) + right(v);
                else if (operator === '-')
                    left = v => a(v) - right(v);
                else if (operator === '*')
                    left = v => a(v) * right(v);
                else if (operator === '/')
                    left = v => a(v) / right(v);
                else if (operator === '%')
                    left = v => a(v) % right(v);
                else
                    left = v => Math.pow(a(v), right(v));
            }
            return left;
        }
        const evaluate = parse();
        if (index !== tokens.length)
            throw new Error('Unexpected token: ' + tokens[index]);
        if (cache.size >= 256)
            cache.clear();
        cache.set(cacheKey, evaluate);
        return evaluate;
    }
    return Object.freeze({ compile });
})();
export { MathExpressions };
