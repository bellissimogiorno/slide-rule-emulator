import { makeLogLogScale, makePickettLogLogScale } from "#catalog/factories.js";
const loglogScales = {
    LL0: makeLogLogScale("LL0", "LL0", -3, 1, "e^x for x from 0.001 to 0.01."),
    LL1: makeLogLogScale("LL1", "LL1", -2, 1, "e^x for x from 0.01 to 0.1."),
    LL2: makeLogLogScale("LL2", "LL2", -1, 1, "e^x for x from 0.1 to 1."),
    LL3: makeLogLogScale("LL3", "LL3", 0, 1, "e^x for x from 1 to 10."),
    LL4: makeLogLogScale("LL4", "LL4", 1, 1, "e^x for x from 10 to 100."),
    LL00: makeLogLogScale("LL00", "LL00", -3, -1, "e^-x for x from 0.001 to 0.01."),
    LL01: makeLogLogScale("LL01", "LL01", -2, -1, "e^-x for x from 0.01 to 0.1."),
    LL02: makeLogLogScale("LL02", "LL02", -1, -1, "e^-x for x from 0.1 to 1."),
    LL03: makeLogLogScale("LL03", "LL03", 0, -1, "e^-x for x from 1 to 10."),
    LL04: makeLogLogScale("LL04", "LL04", 1, -1, "e^-x for x from 10 to 100."),
    P10LL0: makePickettLogLogScale("P10LL0", "LL0+", -3, 1, "Pickett base-10 range 10^(0.001D) to 10^(0.01D)."),
    P10LL1: makePickettLogLogScale("P10LL1", "LL1+", -2, 1, "Pickett base-10 range 10^(0.01D) to 10^(0.1D)."),
    P10LL2: makePickettLogLogScale("P10LL2", "LL2+", -1, 1, "Pickett base-10 range 10^(0.1D) to 10^D."),
    P10LL3: makePickettLogLogScale("P10LL3", "LL3+", 0, 1, "Pickett base-10 range 10^D to 10^(10D)."),
    P10LL00: makePickettLogLogScale("P10LL00", "LL0−", -3, -1, "Reciprocal Pickett base-10 range."),
    P10LL01: makePickettLogLogScale("P10LL01", "LL1−", -2, -1, "Reciprocal Pickett base-10 range."),
    P10LL02: makePickettLogLogScale("P10LL02", "LL2−", -1, -1, "Reciprocal Pickett base-10 range."),
    P10LL03: makePickettLogLogScale("P10LL03", "LL3−", 0, -1, "Reciprocal Pickett base-10 range.")
};
export { loglogScales };
