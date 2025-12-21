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
            aiProcess: 'Proses AI',
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
            workflowGuide: 'Panduan Alur Kerja',
            statisticalAnalysis: 'Analisis Statistik',
            yamazumi: 'Grafik Yamazumi',
            manualCreation: 'Pembuatan Manual',
            valueStreamMap: 'Value Stream Map',
            multiCamera: 'Fusi 3D Multi-Kamera',
            vrTraining: 'Mode Pelatihan VR',
            knowledgeBase: 'Knowledge Base',
            broadcast: 'Broadcast',
            actionRecognition: 'Pengenalan Aksi',
            cycleSegmentation: 'Segmentasi Cycle',
            files: 'File Explorer',
            diagnostics: 'Diagnostik Sistem'
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
        },
        landing: {
            nav: {
                features: 'Fitur',
                solutions: 'Solusi',
                login: 'Masuk',
                startDemo: 'Mulai Demo'
            },
            hero: {
                newBadge: '✨ Baru: AI Manual Generation',
                title: 'Optimalkan Gerakan dengan',
                highlight: 'Analisis Cerdas',
                subtitle: 'Mavi menggunakan computer vision canggih untuk menganalisis alur kerja, menghitung waktu standar dan mengidentifikasi waste secara otomatis. Tingkatkan produktivitas hingga 40%.',
                ctaPrimary: 'Mulai Demo Gratis',
                ctaSecondary: 'Pelajari Lebih Lanjut'
            },
            solutions: {
                title: 'Mengapa memilih Mavi?',
                oldWay: 'Cara Lama',
                maviWay: 'Solusi Mavi',
                old: {
                    stopwatch: {
                        title: 'Stopwatch Manual',
                        desc: 'Pengukuran waktu tidak akurat karena tergantung kecepatan reaksi manusia.'
                    },
                    paper: {
                        title: 'Kertas & Papan Dada',
                        desc: 'Data terjebak di kertas, memerlukan input manual ke Excel di kemudian hari.'
                    },
                    subjective: {
                        title: 'Analisis Subjektif',
                        desc: 'Engineer yang berbeda menghasilkan hasil yang berbeda untuk tugas yang sama.'
                    }
                },
                mavi: {
                    video: {
                        title: 'Analisis Video AI',
                        desc: 'Waktu yang sangat presisi diambil otomatis dari rekaman video.'
                    },
                    digital: {
                        title: 'Digital & Instan',
                        desc: 'Data langsung didigitalkan. Buat laporan dan manual dalam satu klik.'
                    },
                    standardized: {
                        title: 'Terstandarisasi & Akurat',
                        desc: 'Analisis konsisten setiap saat, menghilangkan kesalahan dan bias manusia.'
                    },
                    cta: 'Beralih ke Mavi Sekarang'
                }
            },
            features: {
                title: 'Fitur yang lebih hebat',
                manual: {
                    title: 'Pembuat Manual',
                    desc: 'Ubah analisis menjadi manual pelatihan. Impor dari Excel/Word atau buat dari langkah video.'
                },
                workflow: {
                    title: 'Alur Kerja Drag & Drop',
                    desc: 'Susun ulang elemen proses secara visual untuk mencoba tata letak baru tanpa mengganggu lini.'
                },
                cloud: {
                    title: 'Sinkronisasi Cloud',
                    desc: 'Berkolaborasi dengan tim secara real-time. Sinkronkan proyek dan manual di seluruh perangkat dengan aman.'
                }
            },
            how: {
                title: 'Cara Kerja Mavi',
                capture: {
                    title: 'Rekam',
                    desc: 'Rekam lini produksi Anda atau unggah file video yang ada langsung ke platform.'
                },
                analyze: {
                    title: 'Analisis',
                    desc: 'Mesin Computer Vision kami mendeteksi siklus, menghitung waktu, dan mengidentifikasi waste secara otomatis.'
                },
                improve: {
                    title: 'Tingkatkan',
                    desc: 'Gunakan wawasan berbasis data untuk menyeimbangkan lini, menghilangkan hambatan, dan meningkatkan produktivitas.'
                }
            },
            audience: {
                title: 'Dibuat untuk profesional',
                ie: {
                    title: 'Industrial Engineers',
                    desc: 'Berhenti menghabiskan waktu berjam-jam untuk input data manual. Tangkap siklus secara otomatis dan buat grafik kerja standar dalam hitungan menit.'
                },
                pm: {
                    title: 'Plant Managers',
                    desc: 'Dapatkan visibilitas penuh ke lini produksi Anda. Identifikasi bottleneck secara instan dan lacak perbaikan efisiensi dari waktu ke waktu.'
                },
                lc: {
                    title: 'Lean Consultants',
                    desc: 'Berikan nilai kepada klien Anda lebih cepat. Gunakan Mavi untuk memberikan rekomendasi berbasis data dan bukti visual "Sebelum/Sesudah" yang mengesankan.'
                }
            },
            faq: {
                title: 'Pertanyaan yang Sering Diajukan',
                q1: {
                    q: 'Apakah data video saya aman?',
                    a: 'Ya. Mavi menggunakan enkripsi tingkat perusahaan. Untuk paket Pro, data disimpan dengan aman di cloud. Untuk paket Starter, data tidak pernah meninggalkan perangkat lokal Anda.'
                },
                q2: {
                    q: 'Bisakah saya mengekspor laporan ke Excel?',
                    a: 'Tentu saja. Anda dapat mengekspor semua data analisis, grafik, dan lembar kerja standar langsung ke format Excel, PDF, atau Word.'
                },
                q3: {
                    q: 'Apakah saya memerlukan perangkat keras khusus?',
                    a: 'Tidak. Mavi bekerja dengan file video standar apa pun (MP4, WEBM) atau input webcam langsung. Tidak diperlukan sensor mahal.'
                }
            },
            cta: {
                title: 'Siap untuk mengoptimalkan alur kerja Anda?',
                desc: 'Bergabunglah dengan ribuan engineer yang menghemat waktu dan meningkatkan efisiensi dengan Mavi.',
                button: 'Mulai Uji Coba Gratis'
            },
            footer: {
                product: 'Produk',
                company: 'Perusahaan',
                resources: 'Sumber Daya',
                legal: 'Legal',
                rights: '© 2025 Mavi Systems Inc. Hak cipta dilindungi undang-undang.'
            }
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
            aiProcess: 'AI Process',
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
            workflowGuide: 'Workflow Guide',
            statisticalAnalysis: 'Statistical Analysis',
            yamazumi: 'Yamazumi Chart',
            manualCreation: 'Manual Creation',
            valueStreamMap: 'Value Stream Map',
            multiCamera: 'Multi-Camera 3D Fusion',
            vrTraining: 'VR Training Mode',
            knowledgeBase: 'Knowledge Base',
            broadcast: 'Broadcast',
            actionRecognition: 'Action Recognition',
            cycleSegmentation: 'Cycle Segmentation',
            files: 'File Explorer',
            diagnostics: 'System Diagnostics'
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
        },
        landing: {
            nav: {
                features: 'Features',
                solutions: 'Solutions',
                login: 'Log In',
                startDemo: 'Start Demo'
            },
            hero: {
                newBadge: '✨ New: AI Manual Generation',
                title: 'Optimize Motion with',
                highlight: 'Intelligent Analysis',
                subtitle: 'Mavi uses advanced computer vision to analyze workflows, calculating standard times and identifying waste automatically. Increase productivity by up to 40%.',
                ctaPrimary: 'Start Free Demo',
                ctaSecondary: 'Learn More'
            },
            solutions: {
                title: 'Why choose Mavi?',
                oldWay: 'The Old Way',
                maviWay: 'The Mavi Solution',
                old: {
                    stopwatch: {
                        title: 'Manual Stopwatch',
                        desc: 'Inaccurate timing dependent on human reaction speed.'
                    },
                    paper: {
                        title: 'Paper & Clipboard',
                        desc: 'Data is trapped on paper, requiring manual entry into Excel later.'
                    },
                    subjective: {
                        title: 'Subjective Analysis',
                        desc: 'Different engineers produce different results for the same task.'
                    }
                },
                mavi: {
                    video: {
                        title: 'AI Video Analysis',
                        desc: 'Frame-perfect timing automatically extracted from video footage.'
                    },
                    digital: {
                        title: 'Digital & Instant',
                        desc: 'Data is digitized immediately. Generate reports and manuals in one click.'
                    },
                    standardized: {
                        title: 'Standardized & Accurate',
                        desc: 'Consistent analysis every time, eliminating human error and bias.'
                    },
                    cta: 'Switch to Mavi Today'
                }
            },
            features: {
                title: 'More powerful features',
                manual: {
                    title: 'Manual Creator',
                    desc: 'Turn analysis into training manuals. Import from Excel/Word or generate from video steps.'
                },
                workflow: {
                    title: 'Drag & Drop Workflow',
                    desc: 'Rearrange process elements visually to test new layouts without disrupting the line.'
                },
                cloud: {
                    title: 'Cloud Sync',
                    desc: 'Collaborate with your team in real-time. Sync projects and manuals across devices securely.'
                }
            },
            how: {
                title: 'How Mavi Works',
                capture: {
                    title: 'Capture',
                    desc: 'Record your production line or upload an existing video file directly to the platform.'
                },
                analyze: {
                    title: 'Analyze',
                    desc: 'Our Computer Vision engine detects cycles, calculates times, and identifies waste automatically.'
                },
                improve: {
                    title: 'Improve',
                    desc: 'Use data-backed insights to rebalance lines, eliminate bottlenecks, and boost productivity.'
                }
            },
            audience: {
                title: 'Built for professionals',
                ie: {
                    title: 'Industrial Engineers',
                    desc: 'Stop spending hours on manual data entry. Capture cycles automatically and generate standard work charts in minutes.'
                },
                pm: {
                    title: 'Plant Managers',
                    desc: 'Gain full visibility into your production lines. Identify bottlenecks instantly and track efficiency improvements over time.'
                },
                lc: {
                    title: 'Lean Consultants',
                    desc: 'Deliver value to your clients faster. Use Mavi to provide data-backed recommendations and impressive "Before/After" visual proof.'
                }
            },
            faq: {
                title: 'Frequently Asked Questions',
                q1: {
                    q: 'Is my video data secure?',
                    a: 'Yes. Mavi uses enterprise-grade encryption. For Pro plans, data is stored securely in the cloud. For Starter plans, data never leaves your local device.'
                },
                q2: {
                    q: 'Can I export reports to Excel?',
                    a: 'Absolutely. You can export all analysis data, charts, and standard work sheets directly to Excel, PDF, or Word formats.'
                },
                q3: {
                    q: 'Do I need special hardware?',
                    a: 'No. Mavi works with any standard video file (MP4, WEBM) or direct webcam input. No expensive sensors required.'
                }
            },
            cta: {
                title: 'Ready to optimize your workflow?',
                desc: 'Join thousands of engineers who are saving time and improving efficiency with Mavi.',
                button: 'Start Free Trial'
            },
            footer: {
                product: 'Product',
                company: 'Company',
                resources: 'Resources',
                legal: 'Legal',
                rights: '© 2025 Mavi Systems Inc. All rights reserved.'
            }
        }
    },
    jp: {
        // Japanese
        app: {
            title: 'MAVi - 動態分析と可視化',
            welcome: 'MAViへようこそ'
        },
        header: {
            video: 'ビデオ',
            aiProcess: 'AIプロセス',
            analysis: '分析',
            rearrange: '再配置',
            cycleAnalysis: 'サイクル分析',
            aggregation: '集計',
            standardTime: '標準時間',
            waste: '無駄の排除',
            therblig: 'サーブリッグ分析',
            bestWorst: 'ベスト vs ワースト',
            comparison: '比較',
            help: 'ヘルプ',
            uploadLogo: 'ロゴ/透かしをアップロード',
            screenshot: 'スクリーンショット撮影',
            exportData: 'データエクスポート (JSON)',
            sessions: 'セッション管理',
            workflowGuide: 'ワークフローガイド',
            statisticalAnalysis: '統計分析',
            yamazumi: '山積み表',
            manualCreation: 'マニュアル作成',
            valueStreamMap: 'バリューストリームマップ',
            multiCamera: 'マルチカメラ3D融合',
            vrTraining: 'VRトレーニングモード',
            knowledgeBase: 'ナレッジベース',
            broadcast: 'ブロードキャスト',
            actionRecognition: 'アクション認識',
            cycleSegmentation: 'サイクルセグメンテーション',
            files: 'ファイルエクスプローラー',
            diagnostics: 'システム診断'
        },
        common: {
            save: '保存',
            cancel: 'キャンセル',
            delete: '削除',
            edit: '編集',
            close: '閉じる',
            upload: 'アップロード',
            export: 'エクスポート',
            import: 'インポート',
            search: '検索',
            filter: 'フィルター',
            loading: '読み込み中...',
            noData: 'データなし',
            confirm: '確認',
            success: '成功',
            error: 'エラー',
            warning: '警告',
            open: '開く',
            select: '選択'
        },
        categories: {
            valueAdded: '付加価値',
            nonValueAdded: '非付加価値',
            waste: '無駄'
        },
        project: {
            newProject: '新規プロジェクト',
            openProject: 'プロジェクトを開く',
            projectName: 'プロジェクト名',
            selectProject: 'プロジェクトを選択',
            noProjects: '保存されたプロジェクトはありません',
            createNew: '新規プロジェクト作成',
            createProject: 'プロジェクト作成',
            enterName: 'プロジェクト名を入力',
            videoFile: 'ビデオファイル',
            selectVideo: 'ビデオを選択',
            lastModified: '最終更新',
            errors: {
                nameRequired: 'プロジェクト名は必須です',
                videoRequired: 'ビデオファイルを選択してください',
                nameExists: 'プロジェクト名が既に存在します',
                notFound: 'プロジェクトが見つかりません'
            }
        },
        measurement: {
            startMeasurement: '計測開始',
            endMeasurement: '計測終了',
            elementName: '要素名',
            category: 'カテゴリー',
            duration: '所要時間',
            startTime: '開始時間',
            endTime: '終了時間'
        },
        landing: {
            nav: {
                features: '機能',
                solutions: '解決策',
                login: 'ログイン',
                startDemo: 'デモ開始'
            },
            hero: {
                newBadge: '✨ 新機能: AIマニュアル生成',
                title: '動作を最適化する',
                highlight: 'インテリジェント分析',
                subtitle: 'Maviは高度なコンピュータビジョンを使用してワークフローを分析し、標準時間を計算して無駄を自動的に特定します。生産性を最大40%向上させます。',
                ctaPrimary: '無料デモを開始',
                ctaSecondary: '詳細を見る'
            },
            solutions: {
                title: 'なぜMaviを選ぶのか？',
                oldWay: '従来の方法',
                maviWay: 'Maviのソリューション',
                old: {
                    stopwatch: {
                        title: '手動ストップウォッチ',
                        desc: '人間の反応速度に依存するため、不正確なタイミング。'
                    },
                    paper: {
                        title: '紙とクリップボード',
                        desc: 'データが紙に閉じ込められ、後でExcelへの手動入力が必要。'
                    },
                    subjective: {
                        title: '主観的な分析',
                        desc: '同じタスクでもエンジニアによって結果が異なる。'
                    }
                },
                mavi: {
                    video: {
                        title: 'AIビデオ分析',
                        desc: 'ビデオ映像から自動的に抽出されるフレーム単位の正確なタイミング。'
                    },
                    digital: {
                        title: 'デジタル＆即時',
                        desc: 'データは即座にデジタル化。ワンクリックでレポートとマニュアルを生成。'
                    },
                    standardized: {
                        title: '標準化＆正確',
                        desc: '常に一貫した分析を行い、人為的ミスやバイアスを排除。'
                    },
                    cta: '今すぐMaviに切り替える'
                }
            },
            features: {
                title: 'より強力な機能',
                manual: {
                    title: 'マニュアルクリエイター',
                    desc: '分析をトレーニングマニュアルに変換。Excel/Wordからインポート、またはビデオステップから生成。'
                },
                workflow: {
                    title: 'ドラッグ＆ドロップワークフロー',
                    desc: 'ラインを乱すことなく、新しいレイアウトをテストするためにプロセス要素を視覚的に再配置。'
                },
                cloud: {
                    title: 'クラウド同期',
                    desc: 'チームとリアルタイムでコラボレーション。デバイス間でプロジェクトやマニュアルを安全に同期。'
                }
            },
            how: {
                title: 'Maviの仕組み',
                capture: {
                    title: 'キャプチャ',
                    desc: '生産ラインを録画するか、既存のビデオファイルをプラットフォームに直接アップロード。'
                },
                analyze: {
                    title: '分析',
                    desc: 'コンピュータビジョンエンジンがサイクルを検出し、時間を計算し、無駄を自動的に特定。'
                },
                improve: {
                    title: '改善',
                    desc: 'データに基づいた洞察を使用してラインをリバランスし、ボトルネックを解消して生産性を向上。'
                }
            },
            audience: {
                title: 'プロフェッショナルのための設計',
                ie: {
                    title: 'インダストリアルエンジニア',
                    desc: '手動データ入力に何時間も費やすのはやめましょう。サイクルを自動的にキャプチャし、数分で標準作業表を生成。'
                },
                pm: {
                    title: '工場管理者',
                    desc: '生産ラインを完全に可視化。ボトルネックを即座に特定し、効率改善を継続的に追跡。'
                },
                lc: {
                    title: 'リーンコンサルタント',
                    desc: 'クライアントに価値をより早く提供。Maviを使用してデータに基づいた推奨事項と印象的な「Before/After」の視覚的証拠を提供。'
                }
            },
            faq: {
                title: 'よくある質問',
                q1: {
                    q: 'ビデオデータは安全ですか？',
                    a: 'はい。Maviはエンタープライズグレードの暗号化を使用しています。Proプランでは、データはクラウドに安全に保存されます。Starterプランでは、データがローカルデバイスから離れることはありません。'
                },
                q2: {
                    q: 'レポートをExcelにエクスポートできますか？',
                    a: 'もちろんです。すべての分析データ、チャート、標準作業シートをExcel、PDF、Word形式に直接エクスポートできます。'
                },
                q3: {
                    q: '特別なハードウェアが必要ですか？',
                    a: 'いいえ。Maviは標準的なビデオファイル（MP4、WEBM）または直接のウェブカメラ入力で動作します。高価なセンサーは不要です。'
                }
            },
            cta: {
                title: 'ワークフローを最適化する準備はできましたか？',
                desc: 'Maviで時間を節約し、効率を向上させている数千人のエンジニアに加わりましょう。',
                button: '無料トライアルを開始'
            },
            footer: {
                product: '製品',
                company: '会社',
                resources: 'リソース',
                legal: '法的事項',
                rights: '© 2025 Mavi Systems Inc. All rights reserved.'
            }
        }
    }
};

// Language metadata
export const languages = [
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' }
];
