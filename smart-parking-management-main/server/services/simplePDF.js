import PDFDocument from 'pdfkit';
import History from '../models/History.js';

/**
 * Simple PDF test - Generate minimal PDF
 */
export async function generateSimplePDF(startDate, endDate) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('📝 Starting PDF generation...');

            // Fetch data
            const records = await History.find({
                checkInTime: { $gte: startDate, $lte: endDate }
            }).sort({ checkInTime: -1 }).limit(20);

            console.log(`📊 Found ${records.length} records`);

            const paid = records.filter(r => r.paymentStatus === 'paid');
            const total = paid.reduce((sum, r) => sum + r.fee, 0);

            // Create PDF
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => {
                console.log('✅ PDF generated successfully');
                resolve(Buffer.concat(chunks));
            });
            doc.on('error', err => {
                console.error('❌ PDF error:', err);
                reject(err);
            });

            // Content
            doc.fontSize(20).text('REVENUE REPORT', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Date: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`);
            doc.moveDown(2);

            doc.fontSize(14).text('Summary:');
            doc.fontSize(11);
            doc.text(`Total vehicles: ${records.length}`);
            doc.text(`Paid: ${paid.length}`);
            doc.text(`Revenue: ${total.toLocaleString()} VND`);
            doc.moveDown(2);

            doc.fontSize(14).text('Recent Transactions:');
            doc.moveDown();

            doc.fontSize(9);
            paid.slice(0, 10).forEach((r, i) => {
                doc.text(`${i + 1}. ${r.licensePlate} - ${r.fee.toLocaleString()} VND - ${new Date(r.checkInTime).toLocaleTimeString()}`);
            });

            doc.end();

        } catch (error) {
            console.error('❌ PDF Generation Failed:', error);
            reject(error);
        }
    });
}
