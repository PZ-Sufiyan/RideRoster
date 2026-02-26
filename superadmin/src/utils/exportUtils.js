import * as XLSX from 'xlsx';

/**
 * Exports data to an Excel file.
 * @param {Array} data - The array of objects to export.
 * @param {string} fileName - The name of the file (without extension).
 * @param {string} sheetName - The name of the worksheet.
 */
export const exportToExcel = (data, fileName = 'SystemLogs', sheetName = 'Logs') => {
    // Transform data for export if needed (flattening objects)
    const exportData = data.map(item => ({
        ID: item.id,
        Timestamp: item.timestamp,
        User: item.user.name,
        Action: `${item.actionType} ${item.actionDetail}`,
        Status: item.status,
        'IP Address': item.ip
    }));

    // Create a worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create a workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
