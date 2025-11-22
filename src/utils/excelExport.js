import * as XLSX from 'xlsx';

// Export measurements to Excel
export const exportToExcel = (measurements, videoName = 'Untitled') => {
    if (!measurements || measurements.length === 0) {
        alert('Tidak ada data untuk di-export!');
        return;
    }

    // Prepare data for Excel
    const data = measurements.map((m, index) => ({
        'No.': index + 1,
        'Nama Elemen': m.elementName,
        'Kategori': m.category,
        'Waktu Mulai (s)': m.startTime.toFixed(2),
        'Waktu Selesai (s)': m.endTime.toFixed(2),
        'Durasi (s)': m.duration.toFixed(2)
    }));

    // Calculate statistics
    const totalTime = measurements.reduce((sum, m) => sum + m.duration, 0);
    const valueAddedTime = measurements
        .filter(m => m.category === 'Value-added')
        .reduce((sum, m) => sum + m.duration, 0);
    const nonValueAddedTime = measurements
        .filter(m => m.category === 'Non value-added')
        .reduce((sum, m) => sum + m.duration, 0);
    const wasteTime = measurements
        .filter(m => m.category === 'Waste')
        .reduce((sum, m) => sum + m.duration, 0);

    // Add summary rows
    data.push({});
    data.push({
        'No.': 'RINGKASAN',
        'Nama Elemen': '',
        'Kategori': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': ''
    });
    data.push({
        'No.': 'Total Waktu',
        'Nama Elemen': '',
        'Kategori': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': totalTime.toFixed(2)
    });
    data.push({
        'No.': 'Value-added',
        'Nama Elemen': '',
        'Kategori': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': `${valueAddedTime.toFixed(2)} (${((valueAddedTime / totalTime) * 100).toFixed(1)}%)`
    });
    data.push({
        'No.': 'Non value-added',
        'Nama Elemen': '',
        'Kategori': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': `${nonValueAddedTime.toFixed(2)} (${((nonValueAddedTime / totalTime) * 100).toFixed(1)}%)`
    });
    data.push({
        'No.': 'Waste',
        'Nama Elemen': '',
        'Kategori': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': `${wasteTime.toFixed(2)} (${((wasteTime / totalTime) * 100).toFixed(1)}%)`
    });

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analisis Gerakan');

    // Set column widths
    worksheet['!cols'] = [
        { wch: 5 },  // No
        { wch: 30 }, // Nama Elemen
        { wch: 20 }, // Kategori
        { wch: 18 }, // Waktu Mulai
        { wch: 18 }, // Waktu Selesai
        { wch: 15 }  // Durasi
    ];

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${videoName}_${timestamp}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
};
