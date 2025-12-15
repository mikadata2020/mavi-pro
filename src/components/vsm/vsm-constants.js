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
    RAW_MATERIAL: 'raw_material', // New

    // Information Flow
    PRODUCTION_CONTROL: 'production_control', // New
    ELECTRONIC_INFO: 'electronic_info',
    MANUAL_INFO: 'manual_info',
    KANBAN_POST: 'kanban_post',
    SIGNAL_KANBAN: 'signal_kanban', // New
    KANBAN_PRODUCTION: 'kanban_production', // New
    KANBAN_WITHDRAWAL: 'kanban_withdrawal', // New
    EYE_OBSERVATION: 'eye_observation', // New (Go See)
    BUFFER: 'buffer',

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
    customer: { name: 'Customer' },
    kaizen_burst: { name: 'Problem/Idea' },
    production_control: { name: 'Production Control' }, // New
    custom: { name: 'Custom Item', description: '' }
};
