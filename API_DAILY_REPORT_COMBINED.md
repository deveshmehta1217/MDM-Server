# API Documentation: Daily Report Combined (getDailyReportDataV2)

## Endpoint
`GET /api/attendance/daily-report-combined/:date?breakAt=<number>`

## Description
Returns a detailed daily attendance report for a school, grouped by Balvatika divisions, Group A (standards 1 to breakAt-1), Group B (standards breakAt to 8), and grand total. Each row in the `sheet` output contains comprehensive statistics for a class/division, including category-wise counts and percentages.

## Response Format
The response JSON contains:
- `date`: The report date (DD/MM/YYYY)
- `groupBreakAt`: The break point standard for grouping
- `records`: Raw attendance records from the database
- `sheet`: Array of rows, each representing a class/division or subtotal/grand total
- `timestamp`: When the report was generated

## `sheet` Array Structure
Each row in `sheet` is an array of **54 columns**:

### 1. Label (1 column)
- **Column 1**: Class/Division label (e.g., `"બાલવાટિકા - A"`, `"1 - B"`, etc.)

### 2. Registered Students (11 columns)
- **Columns 2-12**: Category-wise registered student counts:
    - SC Male
    - SC Female
    - ST Male
    - ST Female
    - OBC Male
    - OBC Female
    - General Male
    - General Female
    - Total Male (sum of all categories)
    - Total Female (sum of all categories)
    - Total Students (male + female)

### 3. Present Students (11 columns)
- **Columns 13-23**: Same structure as above, for present students

### 4. MDM (Meal Taken Students) (11 columns)
- **Columns 24-34**: Same structure as above, for students who took MDM

### 5. Alpahar (Alpahar Taken Students) (11 columns)
- **Columns 35-45**: Same structure as above, for students who took Alpahar

### 6. Percentages (9 columns)
- **Columns 46-48**: Present Percentage (of registered) for Male, Female, Total
- **Columns 49-51**: Alpahar Percentage (of present) for Male, Female, Total
- **Columns 52-54**: MDM Percentage (of present) for Male, Female, Total

#### Percentage Calculations
- **Present %** = (Present / Registered) × 100
- **Alpahar %** = (Alpahar / Present) × 100
- **MDM %** = (MDM / Present) × 100
- All percentages are shown for Male, Female, and Total

### 7. Subtotal and Grand Total Rows
- After each group (Balvatika, Group A, Group B), a subtotal row is added with the same column structure.
- The last row is the grand total for all classes/divisions.

## Example Row
```
[
  "1 - A",           // Label
  10, 12, 5, 7, ...   // Registered (SC-M, SC-F, ST-M, ST-F, ...)
  9, 11, 4, 6, ...    // Present
  8, 10, 3, 5, ...    // MDM
  7, 9, 2, 4, ...     // Alpahar
  90.00, 91.67, 90.91, // Present % (M, F, T)   
  77.78, 81.82, 79.17, // Alpahar % (M, F, T)
  88.89, 90.91, 89.58  // MDM % (M, F, T)
]
```

## Notes
- All counts and percentages are calculated per class/division.
- If a denominator is zero, the percentage is reported as 0.
- The output is suitable for direct export to Excel or further processing.

---
For any questions or clarifications, refer to the implementation in `controllers/attendanceControllers/dailyReportCombined.js`.
