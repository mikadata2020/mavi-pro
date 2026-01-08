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
        'M (Manual)': (Number(m.manualTime) || 0).toFixed(2),
        'A (Auto)': (Number(m.autoTime) || 0).toFixed(2),
        'W (Walk)': (Number(m.walkTime) || 0).toFixed(2),
        'L (Loss)': (Number(m.waitingTime) || 0).toFixed(2),
        'Waktu Mulai (s)': (Number(m.startTime) || 0).toFixed(2),
        'Waktu Selesai (s)': (Number(m.endTime) || 0).toFixed(2),
        'Durasi (s)': (Number(m.duration) || 0).toFixed(2)
    }));

    // Calculate statistics
    const totalTime = measurements.reduce((sum, m) => sum + (Number(m.duration) || 0), 0);
    const totalManual = measurements.reduce((sum, m) => sum + (Number(m.manualTime) || 0), 0);
    const totalAuto = measurements.reduce((sum, m) => sum + (Number(m.autoTime) || 0), 0);
    const totalWalk = measurements.reduce((sum, m) => sum + (Number(m.walkTime) || 0), 0);
    const totalLoss = measurements.reduce((sum, m) => sum + (Number(m.waitingTime) || 0), 0);

    const valueAddedTime = measurements
        .filter(m => m.category === 'Value-added')
        .reduce((sum, m) => sum + (Number(m.duration) || 0), 0);
    const nonValueAddedTime = measurements
        .filter(m => m.category === 'Non value-added')
        .reduce((sum, m) => sum + (Number(m.duration) || 0), 0);
    const wasteTime = measurements
        .filter(m => m.category === 'Waste')
        .reduce((sum, m) => sum + (Number(m.duration) || 0), 0);

    // Add summary rows
    data.push({});
    data.push({
        'No.': 'RINGKASAN',
        'Nama Elemen': '',
        'Kategori': '',
        'M (Manual)': '',
        'A (Auto)': '',
        'W (Walk)': '',
        'L (Loss)': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': ''
    });
    data.push({
        'No.': 'Total Waktu',
        'Nama Elemen': '',
        'Kategori': '',
        'M (Manual)': totalManual.toFixed(2),
        'A (Auto)': totalAuto.toFixed(2),
        'W (Walk)': totalWalk.toFixed(2),
        'L (Loss)': totalLoss.toFixed(2),
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': totalTime.toFixed(2)
    });
    data.push({
        'No.': 'Value-added',
        'Nama Elemen': '',
        'Kategori': '',
        'M (Manual)': '',
        'A (Auto)': '',
        'W (Walk)': '',
        'L (Loss)': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': `${valueAddedTime.toFixed(2)} ${totalTime > 0 ? `(${((valueAddedTime / totalTime) * 100).toFixed(1)}%)` : ''}`
    });
    data.push({
        'No.': 'Non value-added',
        'Nama Elemen': '',
        'Kategori': '',
        'M (Manual)': '',
        'A (Auto)': '',
        'W (Walk)': '',
        'L (Loss)': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': `${nonValueAddedTime.toFixed(2)} ${totalTime > 0 ? `(${((nonValueAddedTime / totalTime) * 100).toFixed(1)}%)` : ''}`
    });
    data.push({
        'No.': 'Waste',
        'Nama Elemen': '',
        'Kategori': '',
        'M (Manual)': '',
        'A (Auto)': '',
        'W (Walk)': '',
        'L (Loss)': '',
        'Waktu Mulai (s)': '',
        'Waktu Selesai (s)': '',
        'Durasi (s)': `${wasteTime.toFixed(2)} ${totalTime > 0 ? `(${((wasteTime / totalTime) * 100).toFixed(1)}%)` : ''}`
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
        { wch: 12 }, // M
        { wch: 12 }, // A
        { wch: 12 }, // W
        { wch: 12 }, // L
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

// Export comparison data to Excel
export const exportComparisonToExcel = (comparisonData) => {
    if (!comparisonData || comparisonData.length === 0) {
        alert('Tidak ada data untuk di-export!');
        return;
    }

    const data = comparisonData.map((item, index) => ({
        'No.': index + 1,
        'Sesi': item.name,
        'Tanggal': item.date,
        'Total Waktu (s)': item.totalTime.toFixed(2),
        'Value Added (s)': item.valueAdded.toFixed(2),
        'Non Value Added (s)': item.nonValueAdded.toFixed(2),
        'Waste (s)': item.waste.toFixed(2),
        'VA %': item.vaPercent.toFixed(1) + '%'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Perbandingan Sesi');

    worksheet['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 10 }
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    XLSX.writeFile(workbook, `Comparison_${timestamp}.xlsx`);
};

// Export aggregation data to Excel
export const exportAggregationToExcel = (aggregationData) => {
    if (!aggregationData || aggregationData.length === 0) {
        alert('Tidak ada data untuk di-export!');
        return;
    }

    const data = aggregationData.map((item, index) => ({
        'No.': index + 1,
        'Nama Elemen': item.name,
        'Kategori': item.category,
        'Count': item.count,
        'Min (s)': item.min.toFixed(2),
        'Max (s)': item.max.toFixed(2),
        'Avg (s)': item.avg.toFixed(2),
        'Std Dev': item.stdDev.toFixed(3),
        'Total (s)': item.total.toFixed(2)
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agregasi Siklus');

    worksheet['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 8 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    XLSX.writeFile(workbook, `Aggregation_${timestamp}.xlsx`);
};

// Export standard time data to Excel
export const exportStandardTimeToExcel = (elementData, globalAllowance) => {
    if (!elementData || elementData.length === 0) {
        alert('Tidak ada data untuk di-export!');
        return;
    }

    const data = elementData.map((item, index) => {
        const normalTime = item.avgTime * (item.rating / 100);
        const standardTime = normalTime * (1 + globalAllowance / 100);

        return {
            'No.': index + 1,
            'Nama Elemen': item.name,
            'Kategori': item.category,
            'Avg Time (s)': item.avgTime.toFixed(2),
            'Rating (%)': item.rating,
            'Normal Time (s)': normalTime.toFixed(2),
            'Allowance (%)': globalAllowance,
            'Standard Time (s)': standardTime.toFixed(2)
        };
    });

    // Add total
    const totalStdTime = elementData.reduce((total, item) => {
        const normalTime = item.avgTime * (item.rating / 100);
        const standardTime = normalTime * (1 + globalAllowance / 100);
        return total + standardTime;
    }, 0);

    data.push({});
    data.push({
        'No.': 'TOTAL',
        'Nama Elemen': '',
        'Kategori': '',
        'Avg Time (s)': '',
        'Rating (%)': '',
        'Normal Time (s)': '',
        'Allowance (%)': '',
        'Standard Time (s)': totalStdTime.toFixed(2)
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Standard Time');

    worksheet['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 15 },
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 }
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    XLSX.writeFile(workbook, `StandardTime_${timestamp}.xlsx`);
};

// Export Cycle Time Analysis data to Excel
export const exportCycleTimeAnalysisToExcel = (aggregatedData, maxCycles) => {
    if (!aggregatedData || aggregatedData.length === 0) {
        alert('Tidak ada data untuk di-export!');
        return;
    }

    // Prepare headers
    const headers = ['No.', 'Element Name', 'Category'];
    for (let i = 1; i <= maxCycles; i++) {
        headers.push(`Cycle ${i} (s)`);
    }
    headers.push('Min (s)', 'Max (s)', 'Average (s)');

    // Prepare data rows
    const data = aggregatedData.map((item, index) => {
        const row = {
            'No.': index + 1,
            'Element Name': item.elementName,
            'Category': item.category
        };

        // Add cycle values
        for (let i = 1; i <= maxCycles; i++) {
            row[`Cycle ${i} (s)`] = item.cycleValues[i] ? item.cycleValues[i].toFixed(2) : '-';
        }

        // Add stats
        row['Min (s)'] = item.min.toFixed(2);
        row['Max (s)'] = item.max.toFixed(2);
        row['Average (s)'] = item.average.toFixed(2);

        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cycle Time Analysis');

    // Set column widths
    const wscols = [
        { wch: 5 },  // No
        { wch: 30 }, // Element Name
        { wch: 20 }, // Category
    ];
    // Add widths for cycle columns
    for (let i = 0; i < maxCycles; i++) {
        wscols.push({ wch: 12 });
    }
    // Add widths for stats
    wscols.push({ wch: 12 }, { wch: 12 }, { wch: 12 });

    worksheet['!cols'] = wscols;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    XLSX.writeFile(workbook, `CycleTimeAnalysis_${timestamp}.xlsx`);
};
