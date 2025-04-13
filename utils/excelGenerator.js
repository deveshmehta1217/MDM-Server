import ExcelJS from 'exceljs';

export const generateExcel = async (data, options) => {
  const workbook = new ExcelJS.Workbook();
  
  if (options.reportType === 'monthly') {
    await generateMonthlyReport(workbook, data, options);
  } else if (options.reportType === 'halfMonthly') {
    await generateHalfMonthlyReport(workbook, data, options);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

const generateMonthlyReport = async (workbook, data, { year, month }) => {
  data.forEach(classData => {
    const worksheet = workbook.addWorksheet(
      `Class ${classData.class.standard}-${classData.class.division}`
    );

    // Add headers
    worksheet.addRow(['Monthly MDM Report']);
    worksheet.addRow([`Class: ${classData.class.standard}-${classData.class.division}`]);
    worksheet.addRow([`Month: ${month}/${year}`]);
    worksheet.addRow([]);

    // Add daily summary
    worksheet.addRow(['Date', 'Present', 'Meals Taken', 'Menu Type']);
    classData.dailyTotals.forEach(daily => {
      worksheet.addRow([
        daily.date.toLocaleDateString(),
        daily.totals.present,
        daily.totals.mealTaken,
        daily.menuType
      ]);
    });

    // Add category-wise summary
    worksheet.addRow([]);
    worksheet.addRow(['Category-wise Summary']);
    worksheet.addRow(['Category', 'Present', 'Meals Taken']);
    Object.entries(classData.monthlyTotal.byCategory || {}).forEach(([category, counts]) => {
      worksheet.addRow([category, counts.present, counts.mealTaken]);
    });

    // Add student-wise details
    worksheet.addRow([]);
    worksheet.addRow(['Student-wise Details']);
    worksheet.addRow(['Roll No', 'Name', 'Present Days', 'Meals Taken']);
    classData.students.forEach(student => {
      worksheet.addRow([
        student.student.rollNumber,
        student.student.name,
        student.summary.totalPresent,
        student.summary.totalMealTaken
      ]);
    });
  });
};

const generateHalfMonthlyReport = async (workbook, data, { year, month, half }) => {
  // Similar to monthly report but with half-month specific data
  data.forEach(classData => {
    const worksheet = workbook.addWorksheet(
      `Class ${classData.class.standard}-${classData.class.division}`
    );

    // Add headers
    worksheet.addRow(['Half-Monthly MDM Report']);
    worksheet.addRow([`Class: ${classData.class.standard}-${classData.class.division}`]);
    worksheet.addRow([`Month: ${month}/${year} - Half: ${half}`]);
    worksheet.addRow([]);

    // Rest of the implementation follows similar pattern as monthly report
    // but uses the half-monthly specific data
  });
};
