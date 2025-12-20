export const VSMSymbols = {
    // Process Flow
    PROCESS: 'process',
    SUPPLIER: 'supplier',
    CUSTOMER: 'customer',
    DATA_BOX: 'data_box',
    OPERATOR: 'operator',
    KAIZEN_BURST: 'kaizen_burst',

    // Material Flow
    INVENTORY: 'inventory',
    SUPERMARKET: 'supermarket',
    FIFO: 'fifo',
    SAFETY_STOCK: 'safety_stock',
    TRUCK: 'truck',
    RAW_MATERIAL: 'raw_material',
    PUSH_ARROW: 'push_arrow', // NEW: Push system arrow
    FINISHED_GOODS: 'finished_goods', // NEW: Finished goods to customer

    // Information Flow
    PRODUCTION_CONTROL: 'production_control',
    ELECTRONIC_INFO: 'electronic_info',
    MANUAL_INFO: 'manual_info',
    KANBAN_POST: 'kanban_post',
    SIGNAL_KANBAN: 'signal_kanban',
    KANBAN_PRODUCTION: 'kanban_production',
    KANBAN_WITHDRAWAL: 'kanban_withdrawal',
    EYE_OBSERVATION: 'eye_observation', // Go See
    HEIJUNKA_BOX: 'heijunka_box', // NEW: Load leveling box
    BUFFER: 'buffer',

    // Timeline & Metrics
    TIMELINE: 'timeline', // NEW: Lead time timeline

    // Custom
    CUSTOM: 'custom',
};

export const PROCESS_TYPES = {
    NORMAL: 'normal',
    PACEMAKER: 'pacemaker',
    SHARED: 'shared',
    OUTSIDE: 'outside',
    PERIODIC: 'periodic'
};

export const INITIAL_DATA = {
    process: {
        name: 'Process',
        ct: 60, // Cycle Time (sec)
        co: 30, // Changeover (min)
        uptime: 95, // %
        yield: 99, // % (New)
        va: 60, // VA Time (sec) (New)
        operators: 1, // Count (New)
        shifts: 1,
        processType: 'normal'
    },
    inventory: { amount: 0, unit: 'pcs', time: 0 },
    supplier: { name: 'Supplier' },
    customer: {
        name: 'Customer',
        demand: 1000,
        unit: 'pcs',
        availableTime: 480, // min/shift
        shifts: 1,
        taktTime: 0
    }, // Enhanced
    kaizen_burst: { name: 'Problem/Idea' },
    production_control: { name: 'Production Control' },
    heijunka_box: { name: 'Heijunka Box', description: 'Load Leveling' }, // NEW
    timeline: { name: 'Timeline', leadTime: 0, vaTime: 0 }, // NEW
    finished_goods: { name: 'Finished Goods', amount: 0 }, // NEW
    custom: { name: 'Custom Item', description: '' }
};
