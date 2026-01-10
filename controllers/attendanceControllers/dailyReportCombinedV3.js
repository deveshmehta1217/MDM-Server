import Attendance from '../../models/Attendace.js';

export const prepareDailyReport = async (schoolId, date, breakAt) => {
    const queryDate = new Date(date);

    const categoriesCode = ['sc', 'st', 'obc', 'general'];
    // Each section now has 11 columns: sc-m, sc-f, sc-t, st-m, st-f, st-t, obc-m, obc-f, obc-t, gen-m, gen-f, gen-t, total-m, total-f, total-t
    // But as per user, each section will have 11 values: (sc-m+f, st-m+f, obc-m+f, gen-m+f, total-m+f+t)
    // So, for each category: m, f, t (t = m+f), then total: m, f, t
    // For 4 categories: 4*(m+f+t) = 12, but user wants 11: so for each category, (m+f), and then total (m+f+t)
    // But user says: sc-m+f, st-m+f, obc-m+f, gen-m+f, total-m+f+t (so, 4*2 + 3 = 11?)
    // But user says: each section will have 11 values: sc-m, sc-f, sc-t, st-m, st-f, st-t, obc-m, obc-f, obc-t, gen-m, gen-f, gen-t, total-m, total-f, total-t
    // But then 4*3 + 3 = 15. But user says 11. Let's follow: sc-m, sc-f, st-m, st-f, obc-m, obc-f, gen-m, gen-f, total-m, total-f, total-t (11 columns)

    // We'll use: sc-m, sc-f, st-m, st-f, obc-m, obc-f, gen-m, gen-f, total-m, total-f, total-t
    // For each section: registered, present, meal, alpahar
    // Then "ટકાવારી" section: "હાજરી" (present/registered*100), "અલ્પાહાર" or "mdm" (meal/present*100), each with m, f, t

    // Helper to get [sc-m, sc-f, st-m, st-f, obc-m, obc-f, gen-m, gen-f, total-m, total-f, total-t]
    const calculateCategoryTotals = (source) => {
        let sc_m = source?.sc?.male || 0;
        let sc_f = source?.sc?.female || 0;
        let st_m = source?.st?.male || 0;
        let st_f = source?.st?.female || 0;
        let obc_m = source?.obc?.male || 0;
        let obc_f = source?.obc?.female || 0;
        let gen_m = source?.general?.male || 0;
        let gen_f = source?.general?.female || 0;
        let total_m = sc_m + st_m + obc_m + gen_m;
        let total_f = sc_f + st_f + obc_f + gen_f;
        let total_t = total_m + total_f;
        return [sc_m, sc_f, st_m, st_f, obc_m, obc_f, gen_m, gen_f, total_m, total_f, total_t];
    };

    // Helper to update group totals
    const updateTotals = (sourceArray, targetArray) => {
        for (let i = 0; i < sourceArray.length; i++) {
            if (typeof sourceArray[i] === 'number') {
                targetArray[i] += sourceArray[i];
            }
        }
    };

    // Helper to calculate % columns
    const calculatePercentages = (registered, present, meal, alpahar) => {
        // registered, present, meal, alpahar: arrays of 11 values
        // %present = present/registered*100 (m, f, t)
        // %alpahar = alpahar/present*100 (m, f, t)
        // %mdm = meal/present*100 (m, f, t)
        // m: index 8, f: index 9, t: index 10
        const safeDiv = (num, den) => den === 0 ? 0 : (num / den) * 100;
        // present
        const present_m = safeDiv(present[8], registered[8]);
        const present_f = safeDiv(present[9], registered[9]);
        const present_t = safeDiv(present[10], registered[10]);
        // alpahar
        const alpahar_m = safeDiv(alpahar[8], present[8]);
        const alpahar_f = safeDiv(alpahar[9], present[9]);
        const alpahar_t = safeDiv(alpahar[10], present[10]);
        // mdm
        const mdm_m = safeDiv(meal[8], present[8]);
        const mdm_f = safeDiv(meal[9], present[9]);
        const mdm_t = safeDiv(meal[10], present[10]);
        return [
            Number(present_m.toFixed(0)),
            Number(present_f.toFixed(0)),
            Number(present_t.toFixed(0)),
            Number(alpahar_m.toFixed(0)),
            Number(alpahar_f.toFixed(0)),
            Number(alpahar_t.toFixed(0)),
            Number(mdm_m.toFixed(0)),
            Number(mdm_f.toFixed(0)),
            Number(mdm_t.toFixed(0)),
        ];
    };

    const data = await Attendance.find(
        {
            date: queryDate,
            schoolId: schoolId
        },
        {
            standard: 1,
            division: 1,
            registeredStudents: 1,
            presentStudents: 1,
            mealTakenStudents: 1,
            alpaharTakenStudents: 1
        }
    ).sort({ standard: 1, division: 1 }).lean();

    // Group rows for balvatika (std 0), groupA (1 to breakAt-1), groupB (breakAt to 8)
    const balvatikaRows = [];
    const groupARows = [];
    const groupBRows = [];

    // Totals for each group
    const totalBalvatika = Array(54).fill(0);
    const totalGroupA = Array(54).fill(0);
    const totalGroupB = Array(54).fill(0);
    const grandTotal = Array(54).fill(0);

    // For each record, build row of 54 columns
    data.forEach((record) => {
        const rowData = [];
        const label = record.standard === 0 ? `બાલવાટિકા - ${record.division}` : `${record.standard} - ${record.division}`;
        rowData.push(label);

        // Registered
        const reg = calculateCategoryTotals(record.registeredStudents);
        rowData.push(...reg);
        // Present
        const pres = calculateCategoryTotals(record.presentStudents);
        rowData.push(...pres);
        // MDM
        const mdm = calculateCategoryTotals(record.mealTakenStudents);
        rowData.push(...mdm);
        // Alpahar
        const alp = calculateCategoryTotals(record.alpaharTakenStudents);
        rowData.push(...alp);

        // Percentages (present, alpahar, mdm)
        const [pr_m, pr_f, pr_t, alp_m, alp_f, alp_t, mdm_m, mdm_f, mdm_t] = calculatePercentages(reg, pres, mdm, alp);
        rowData.push(pr_m, pr_f, pr_t, alp_m, alp_f, alp_t, mdm_m, mdm_f, mdm_t);

        // Now rowData has 1 (label) + 4*11 (sections) + 9 (percentages) = 1+44+9=54

        // Assign to group
        if (record.standard === 0) {
            balvatikaRows.push(rowData);
            updateTotals(rowData.slice(1, 1 + 44), totalBalvatika); // Only sum the 44 value columns
            updateTotals(rowData.slice(45, 54), totalBalvatika.slice(45)); // Add percentages
        } else if (record.standard > 0 && record.standard < breakAt) {
            groupARows.push(rowData);
            updateTotals(rowData.slice(1, 1 + 44), totalGroupA); // Only sum the 44 value columns
            updateTotals(rowData.slice(45, 54), totalGroupA.slice(45)); // Add percentages
        } else if (record.standard >= breakAt) {
            groupBRows.push(rowData);
            updateTotals(rowData.slice(1, 1 + 44), totalGroupB); // Only sum the 44 value columns
            updateTotals(rowData.slice(45, 54), totalGroupB.slice(45)); // Add percentages
        }
        // Grand total
        updateTotals(rowData.slice(1, 1 + 44), grandTotal);
        updateTotals(rowData.slice(45, 54), grandTotal.slice(45));
    });

    // Helper to build subtotal row with correct percentage calculation
    const buildSubtotalRow = (label, totalsArr) => {
        // label + 44 values + 9 percentages
        // Calculate percentages using summed totals
        const reg = totalsArr.slice(0, 11);
        const pres = totalsArr.slice(11, 22);
        const mdm = totalsArr.slice(22, 33);
        const alp = totalsArr.slice(33, 44);
        const percentages = calculatePercentages(reg, pres, mdm, alp);
        return [label, ...totalsArr.slice(0, 44), ...percentages];
    };

    // Build sheet
    const sheet = [];
    // Balvatika rows
    balvatikaRows.forEach(r => sheet.push(r));
    if (balvatikaRows.length > 0) {
        sheet.push(buildSubtotalRow('બાલવાટિકા કુલ', totalBalvatika));
    }
    // Group A rows
    groupARows.forEach(r => sheet.push(r));
    if (groupARows.length > 0) {
        sheet.push(buildSubtotalRow(`1-${breakAt - 1} કુલ`, totalGroupA));
    }
    // Group B rows
    groupBRows.forEach(r => sheet.push(r));
    if (groupBRows.length > 0) {
        sheet.push(buildSubtotalRow(`${breakAt}-8 કુલ`, totalGroupB));
    }
    // Grand total
    sheet.push(buildSubtotalRow('કુલ', grandTotal));

    const responseData = {
        date: queryDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        groupBreakAt: breakAt,
        records: data,  // unmodified original records
        sheet,
        timestamp: new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        })
    };

    return responseData;
}

export const getDailyReportDataV3 = async (req, res) => {
    try {
        const { date } = req.params;
        const breakAt = parseInt(req.query.breakAt || '5', 10);

        const responseData = await prepareDailyReport(req.schoolId, date, breakAt);
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error in getDailyReportData:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
