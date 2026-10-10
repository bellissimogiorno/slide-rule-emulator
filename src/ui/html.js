function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[ch]));
}
function railLabel(rail) {
    return rail === "topStator" ? "Top stator" : rail === "bottomStator" ? "Bottom stator" : "Slide";
}
function railShortLabel(rail) {
    return rail === "topStator" ? "TOP" : rail === "bottomStator" ? "BOT" : "SLIDE";
}
function titleCase(s) { return String(s).slice(0, 1).toUpperCase() + String(s).slice(1); }
function scaleSort(a, b) {
    const order = [
        "C", "D", "CI", "DI", "CF", "DF", "CIF", "DIF", "CFM", "DFM",
        "A", "B", "AI", "BI", "K", "KI", "F5", "F5I",
        "W1", "W1P", "W2", "W2P", "R1", "R2", "Q1", "Q2", "Q3", "5R1", "5R2", "5R3", "5R4", "5R5",
        "L", "LN", "S", "COS", "S_COS", "T", "T1", "T2", "ST", "P", "PS", "PT",
        "LL0", "LL1", "LL2", "LL3", "LL4", "LL00", "LL01", "LL02", "LL03", "LL04",
        "P10LL0", "P10LL1", "P10LL2", "P10LL3", "P10LL00", "P10LL01", "P10LL02", "P10LL03",
        "PN3LL0", "PN3LL1", "PN3LL2", "PN3LL3", "PLL1", "PLL2", "PLL3", "PLL4",
        "SH1", "SH2", "TH", "H1", "H2", "CH", "SD", "TD", "ISD", "ITD", "ISD_ITD", "TD_SD",
        "THETA_R", "THETA_C", "DB", "DQ", "XL", "ZX_XC", "CL", "FREQ", "WAVELENGTH", "OMEGA", "TAU", "TAUR_XCP", "CR", "LR", "COS_THETA", "TCP_CP",
        "BB_T", "BB_TC", "BB_TF", "BB_H_TOTAL", "BB_H_PEAK", "BB_Q_TOTAL", "BB_Q_PEAK", "BB_H_SPEC", "BB_Q_SPEC", "BB_H_BAND", "BB_Q_BAND",
        "F5100_G", "F5100_F", "F5100_E", "F5100_H", "F5100_J", "F5100_I", "F5100_L", "F5100_K", "F5100_M", "F5100_D", "F5100_C", "F5100_B", "F5100_A",
        "F5100_N", "F5100_P", "F5100_O", "F5100_R", "F5100_Q", "F5100_S", "F5100_REF_LAMBDA", "F5100_REF_NU", "F5100_REF_EV"
    ];
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia !== -1 || ib !== -1)
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.localeCompare(b);
}
export { escapeHtml, railLabel, railShortLabel, titleCase, scaleSort };
