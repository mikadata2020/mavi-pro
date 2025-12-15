// Translation files for multi-language support
// Supported languages: ID (Indonesian), EN (English)

export const translations = {
    id: {
        // Indonesian (default)
        app: {
            title: 'MAVi - Motion Analysis & Visualization',
            welcome: 'Selamat datang di MAVi'
        },
        header: {
            video: 'Video',
            analysis: 'Analisis',
            rearrange: 'Susun Ulang',
            cycleAnalysis: 'Analisis Cycle',
            aggregation: 'Agregasi',
            standardTime: 'Waktu Baku',
            waste: 'Eliminasi Waste',
            therblig: 'Analisis Therblig',
            bestWorst: 'Best vs Worst',
            comparison: 'Perbandingan',
            help: 'Bantuan',
            uploadLogo: 'Upload Logo/Watermark',
            screenshot: 'Tangkap Screenshot',
            exportData: 'Export Data (JSON)',
            sessions: 'Kelola Sesi',
            workflowGuide: 'Panduan Alur Kerja'
        },
        common: {
            save: 'Simpan',
            cancel: 'Batal',
            delete: 'Hapus',
            edit: 'Edit',
            close: 'Tutup',
            upload: 'Upload',
            export: 'Export',
            import: 'Import',
            search: 'Cari',
            filter: 'Filter',
            loading: 'Memuat...',
            noData: 'Tidak ada data',
            confirm: 'Konfirmasi',
            success: 'Berhasil',
            error: 'Error',
            warning: 'Peringatan',
            open: 'Buka',
            select: 'Pilih'
        },
        categories: {
            valueAdded: 'Value-Added',
            nonValueAdded: 'Non Value-Added',
            waste: 'Waste'
        },
        project: {
            newProject: 'Project Baru',
            openProject: 'Buka Project',
            projectName: 'Nama Project',
            selectProject: 'Pilih Project',
            noProjects: 'Belum ada project tersimpan',
            createNew: 'Buat Project Baru',
            createProject: 'Buat Project',
            enterName: 'Masukkan nama project',
            videoFile: 'File Video',
            selectVideo: 'Pilih Video',
            lastModified: 'Terakhir Diubah',
            errors: {
                nameRequired: 'Nama project tidak boleh kosong',
                videoRequired: 'Pilih file video terlebih dahulu',
                nameExists: 'Nama project sudah digunakan',
                notFound: 'Project tidak ditemukan'
            }
        },
        measurement: {
            startMeasurement: 'Mulai Pengukuran',
            endMeasurement: 'Akhiri Pengukuran',
            elementName: 'Nama Elemen',
            category: 'Kategori',
            duration: 'Durasi',
            startTime: 'Waktu Mulai',
            endTime: 'Waktu Selesai'
        }
    },
    en: {
        // English
        app: {
            title: 'MAVi - Motion Analysis & Visualization',
            welcome: 'Welcome to MAVi'
        },
        header: {
            video: 'Video',
            analysis: 'Analysis',
            rearrange: 'Rearrange',
            cycleAnalysis: 'Cycle Analysis',
            aggregation: 'Aggregation',
            standardTime: 'Standard Time',
            waste: 'Waste Elimination',
            therblig: 'Therblig Analysis',
            bestWorst: 'Best vs Worst',
            comparison: 'Comparison',
            help: 'Help',
            uploadLogo: 'Upload Logo/Watermark',
            screenshot: 'Capture Screenshot',
            exportData: 'Export Data (JSON)',
            sessions: 'Manage Sessions',
            workflowGuide: 'Workflow Guide'
        },
        common: {
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            close: 'Close',
            upload: 'Upload',
            export: 'Export',
            import: 'Import',
            search: 'Search',
            filter: 'Filter',
            loading: 'Loading...',
            noData: 'No data',
            confirm: 'Confirm',
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            open: 'Open',
            select: 'Select'
        },
        categories: {
            valueAdded: 'Value-Added',
            nonValueAdded: 'Non Value-Added',
            waste: 'Waste'
        },
        project: {
            newProject: 'New Project',
            openProject: 'Open Project',
            projectName: 'Project Name',
            selectProject: 'Select Project',
            noProjects: 'No projects saved',
            createNew: 'Create New Project',
            createProject: 'Create Project',
            enterName: 'Enter project name',
            videoFile: 'Video File',
            selectVideo: 'Select Video',
            lastModified: 'Last Modified',
            errors: {
                nameRequired: 'Project name cannot be empty',
                videoRequired: 'Please select a video file',
                nameExists: 'Project name already exists',
                notFound: 'Project not found'
            }
        },
        measurement: {
            startMeasurement: 'Start Measurement',
            endMeasurement: 'End Measurement',
            elementName: 'Element Name',
            category: 'Category',
            duration: 'Duration',
            startTime: 'Start Time',
            endTime: 'End Time'
        }
    }
};

// Language metadata
export const languages = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇬🇧' }
];
