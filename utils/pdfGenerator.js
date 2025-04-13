import PDFDocument from 'pdfkit';

export const generatePdf = async (data, options) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (options.reportType === 'monthly') {
        generateMonthlyReport(doc, data, options);
      } else if (options.reportType === 'halfMonthly') {
        generateHalfMonthlyReport(doc, data, options);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateMonthlyReport = (doc, data, { year, month }) => {
  data.forEach((classData, index) => {
    if (index > 0) doc.addPage();

    // Add header
    doc.fontSize(16)
      .text('Monthly MDM Report', { align: 'center' })
      .fontSize(14)
      .moveDown()
      .text(`Class: ${classData.class.standard}-${classData.class.division}`)
      .text(`Month: ${month}/${year}`)
      .moveDown();

    // Add daily summary
    doc.fontSize(12)
      .text('Daily Summary', { underline: true })
      .moveDown();

    classData.dailyTotals.forEach(daily => {
      doc.text(
        `${daily.date.toLocaleDateString()}: Present - ${daily.totals.present}, ` +
        `Meals Taken - ${daily.totals.mealTaken}, Menu - ${daily.menuType}`
      );
    });

    // Add monthly totals
    doc.moveDown()
      .text('Monthly Totals', { underline: true })
      .moveDown()
      .text(`Total Present Days: ${classData.monthlyTotal.presentDays}`)
      .text(`Total Meals Served: ${classData.monthlyTotal.totalMealTaken}`)
      .text(`Regular Menu Days: ${classData.monthlyTotal.regularMenuDays}`)
      .text(`Sukhdi Days: ${classData.monthlyTotal.sukhdiDays}`);

    // Add gender-wise summary
    doc.moveDown()
      .text('Gender-wise Summary', { underline: true })
      .moveDown()
      .text(`Male Students: Present - ${classData.monthlyTotal.malePresent}, Meals - ${classData.monthlyTotal.maleMealTaken}`)
      .text(`Female Students: Present - ${classData.monthlyTotal.femalePresent}, Meals - ${classData.monthlyTotal.femaleMealTaken}`);
  });
};

const generateHalfMonthlyReport = (doc, data, { year, month, half }) => {
  // Similar to monthly report but with half-month specific data
  data.forEach((classData, index) => {
    if (index > 0) doc.addPage();

    doc.fontSize(16)
      .text('Half-Monthly MDM Report', { align: 'center' })
      .fontSize(14)
      .moveDown()
      .text(`Class: ${classData.class.standard}-${classData.class.division}`)
      .text(`Month: ${month}/${year} - Half: ${half}`)
      .moveDown();

    // Rest of the implementation follows similar pattern as monthly report
    // but uses the half-monthly specific data
  });
};
