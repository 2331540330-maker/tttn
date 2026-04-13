import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import History from '../models/History.js';
import { Readable } from 'stream';

/**
 * Generate Excel report for revenue data
 */
export async function generateExcelReport(startDate, endDate) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Revenue Report');

    // Set up columns
    worksheet.columns = [
        { header: 'STT', key: 'index', width: 8 },
        { header: 'Biển số xe', key: 'licensePlate', width: 15 },
        { header: 'Thời gian vào', key: 'checkIn', width: 20 },
        { header: 'Thời gian ra', key: 'checkOut', width: 20 },
        { header: 'Thời lượng (phút)', key: 'duration', width: 18 },
        { header: 'Phí (VNĐ)', key: 'fee', width: 15 },
        { header: 'Trạng thái', key: 'status', width: 15 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

    // Fetch data
    const records = await History.find({
        checkInTime: { $gte: startDate, $lte: endDate }
    }).sort({ checkInTime: -1 });

    // Add data rows
    let totalRevenue = 0;
    records.forEach((record, index) => {
        worksheet.addRow({
            index: index + 1,
            licensePlate: record.licensePlate,
            checkIn: new Date(record.checkInTime).toLocaleString('vi-VN'),
            checkOut: record.checkOutTime ? new Date(record.checkOutTime).toLocaleString('vi-VN') : 'Chưa ra',
            duration: record.duration,
            fee: record.fee,
            status: record.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
        });

        if (record.paymentStatus === 'paid') {
            totalRevenue += record.fee;
        }
    });

    // Add summary row
    const summaryRow = worksheet.addRow({
        index: '',
        licensePlate: '',
        checkIn: '',
        checkOut: '',
        duration: 'TỔNG DOANH THU:',
        fee: totalRevenue,
        status: ''
    });
    summaryRow.font = { bold: true, size: 12 };
    summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' }
    };

    // Auto-fit columns
    worksheet.columns.forEach(column => {
        column.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

/**
 * Generate PDF report for revenue data
 */
export async function generatePDFReport(startDate, endDate) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4',
                bufferPages: true
            });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Fetch data first
            const records = await History.find({
                checkInTime: { $gte: startDate, $lte: endDate }
            }).sort({ checkInTime: -1 });

            const paidRecords = records.filter(r => r.paymentStatus === 'paid');
            const totalRevenue = paidRecords.reduce((sum, r) => sum + r.fee, 0);
            const totalVehicles = records.length;

            // Header - Use default fonts only (no Vietnamese diacritics in title)
            doc.fontSize(20).font('Helvetica-Bold').text('BAO CAO DOANH THU', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).font('Helvetica').text(
                `From: ${new Date(startDate).toLocaleDateString('en-GB')} - To: ${new Date(endDate).toLocaleDateString('en-GB')}`,
                { align: 'center' }
            );
            doc.moveDown(1);

            // Summary box
            doc.fontSize(12).font('Helvetica-Bold').text('Summary:', { underline: true });
            doc.moveDown(0.5);
            doc.fontSize(11).font('Helvetica');
            doc.text(`Total vehicles: ${totalVehicles}`);
            doc.text(`Paid: ${paidRecords.length}`);
            doc.text(`Unpaid: ${totalVehicles - paidRecords.length}`);
            doc.text(`Total revenue: ${totalRevenue.toLocaleString()} VND`);
            doc.moveDown(1);

            // Table header
            const tableTop = doc.y;
            doc.fontSize(10).font('Helvetica-Bold');
            doc.text('No.', 50, tableTop, { width: 30 });
            doc.text('License Plate', 85, tableTop, { width: 90 });
            doc.text('Check-in', 180, tableTop, { width: 90 });
            doc.text('Check-out', 275, tableTop, { width: 90 });
            doc.text('Fee (VND)', 370, tableTop, { width: 70 });
            doc.text('Status', 445, tableTop, { width: 100 });

            doc.moveDown(0.8);
            doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown(0.3);

            // Table rows
            doc.font('Helvetica').fontSize(9);
            let currentY = doc.y;
            const maxRows = 25; // Limit rows to fit page

            paidRecords.slice(0, maxRows).forEach((record, index) => {
                if (currentY > 700) return; // Prevent overflow

                doc.text(index + 1, 50, currentY, { width: 30 });
                doc.text(record.licensePlate || 'N/A', 85, currentY, { width: 90 });
                doc.text(
                    new Date(record.checkInTime).toLocaleString('en-GB'),
                    180,
                    currentY,
                    { width: 90 }
                );
                doc.text(
                    record.checkOutTime ? new Date(record.checkOutTime).toLocaleString('en-GB') : 'Not yet',
                    275,
                    currentY,
                    { width: 90 }
                );
                doc.text(record.fee.toLocaleString(), 370, currentY, { width: 70 });
                doc.text(record.paymentStatus === 'paid' ? 'Paid' : 'Unpaid', 445, currentY, { width: 100 });

                currentY += 18;
            });

            // Total row
            if (currentY < 720) {
                doc.moveDown(1);
                doc.fontSize(11).font('Helvetica-Bold');
                doc.text(`TOTAL REVENUE: ${totalRevenue.toLocaleString()} VND`, { align: 'right' });
            }

            // Footer
            doc.moveDown(2);
            doc.fontSize(10).font('Helvetica-Italic').text(
                `Generated: ${new Date().toLocaleString('en-GB')}`,
                { align: 'right' }
            );

            doc.end();
        } catch (error) {
            console.error('PDF Generation Error:', error);
            reject(error);
        }
    });
}

/**
 * Generate tax report
 */
export async function generateTaxReport(startDate, endDate) {
    const records = await History.find({
        checkInTime: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
    });

    const totalRevenue = records.reduce((sum, r) => sum + r.fee, 0);
    const vatRate = 0.08; // 8% VAT
    const vatAmount = totalRevenue * vatRate;
    const revenueBeforeVAT = totalRevenue / (1 + vatRate);

    return {
        period: {
            startDate: new Date(startDate).toLocaleDateString('vi-VN'),
            endDate: new Date(endDate).toLocaleDateString('vi-VN')
        },
        summary: {
            totalTransactions: records.length,
            totalRevenue,
            revenueBeforeVAT: Math.round(revenueBeforeVAT),
            vatAmount: Math.round(vatAmount),
            vatRate: `${vatRate * 100}%`
        },
        records: records.map(r => ({
            licensePlate: r.licensePlate,
            checkInTime: r.checkInTime,
            checkOutTime: r.checkOutTime,
            fee: r.fee,
            feeBeforeVAT: Math.round(r.fee / (1 + vatRate)),
            vat: Math.round(r.fee * vatRate / (1 + vatRate))
        }))
    };
}
