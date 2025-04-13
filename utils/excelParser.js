import XLSX from 'xlsx';

export const parseExcelFile = async (filePath, type) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    switch (type) {
      case 'students':
        return parseStudentData(data);
      case 'teachers':
        return parseTeacherData(data);
      default:
        throw new Error('Invalid Excel parse type');
    }
  } catch (error) {
    throw new Error(`Excel parsing error: ${error.message}`);
  }
};

const parseStudentData = (data) => {
  return data.map(row => ({
    name: row.Name || row.name,
    rollNumber: row.RollNumber || row.rollNumber || row['Roll Number'],
    gender: (row.Gender || row.gender || '').toLowerCase(),
    category: (row.Category || row.category || '').toLowerCase(),
    standard: row.Standard || row.standard || row.Class,
    division: row.Division || row.division
  }));
};

const parseTeacherData = (data) => {
  return data.map(row => ({
    name: row.Name || row.name,
    email: row.Email || row.email,
    password: row.Password || row.password,
    standard: row.Standard || row.standard,
    division: row.Division || row.division
  }));
};
