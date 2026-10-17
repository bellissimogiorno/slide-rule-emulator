/** Specimen row order; educational mathematical reconstruction, not fire control. */
export const pickett14Presets = {
    pickett14: {
        name: "Pickett Model 14 U.S. Military / Artillery",
        group: "Specialist instruments",
        modelLabel: "Pickett Model 14 U.S.", theme: "pickett-es", density: "pickett",
        showFormulas: false, compactScales: true,
        description: "General log-log face and degree/6400-mil trigonometric face. Shared complementary and supplementary angle ticks. Main index-to-index ranges, not a photographic facsimile.",
        instrumentNote: "Historical mathematical reconstruction. Degrees and 6400 mils/turn (not milliradians). Opposite-angle rows end at 90 degrees / 1600 mils; their supplementary readings run backwards. Original end extensions are omitted. Not a ballistic or fire-control calculator.",
        sides: {
            front: { name: "Front - general log-log", topStator: ["PLL1", "PLL2", "P14_A"],
                slide: ["P14_B", "P14_T", "P14_ST", "P14_S", "K", "P14_C"],
                bottomStator: ["P14_D", "PLL3", "PLL4"] },
            back: { name: "Back - degrees and mils", topStator: ["P14_OPP_DEG", "P14_OPP_MIL"],
                slide: ["P14_APEX_MIL", "P14_APEX_DEG", "P14_T_MIL", "P14_ST_MIL", "P14_S_MIL", "P14_BASE"],
                bottomStator: ["P14_DISTANCE", "P14_A"] }
        }
    }
};
