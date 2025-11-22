import React, { useState } from 'react';

function FeatureMenu({ onFeatureSelect }) {
    const [expandedCategory, setExpandedCategory] = useState(null);

    const features = {
        'Analysis/Playback': [
            'Video Limit Adjustment',
            'Display Item Selection (Irregular/Comparative Value Difference)',
            'Screen Display Switch (4 Patterns)',
            'Element Splitting',
            'Time Measurement (Mouse/Keyboard)',
            'Detailed Time Measurement (Mouse Only)',
            'Detailed Time Measurement (Keyboard)',
            'Invalid Motion Measurement (Mouse/Keyboard)',
            'Invalid Measurement Deletion',
            'Element Time Measurement/Measurement Intervals',
            'Rating (Speed Evaluation) Input',
            'Rating Speed Playback',
            'Playback Speed Change (0.03 - Max. 8x speed)',
            'Normal/Reverse Playback',
            'Normal/Reverse Frame-by-frame Playback',
            'Video Zoom Function',
            'Measurement Data Re-splitting',
            'Measurement Data Joining',
            'Unmeasured Element Insertion',
            'Cycle Time Aggregation',
            'Selected Element Aggregation',
            'Standard Time Calculation',
            'Comparative Value Difference Calculation',
            'Irregular Element Type Input',
            'Category Setting (Max. 4)',
            'Combination Chart Type Input',
            'Cycle Measurement (Max. 20 Cycles)',
            'Cycle Measurement Support (Element Name Copying)',
            'Cycle Measurement Support (Time Value Copying)',
            'Element Editor',
            'Category Time Line',
            'Analysis Summary',
            'Element Graph',
            'Pre-Waste Elimination Playback',
            'Waste Elimination Playback',
            'Stop/Repeat Playback',
            'Element Name Input Support (Word Pickup)',
            'Content Duplication',
            'Output Image (Max. 3)',
            'External Link Management (File/URL)',
            'Output Image Selection',
            'Snap Picture',
            'Narration Recording',
            'Narration Automatic Generation',
            'Narration Start Time Setting',
            'Clipboard (Image/Text/Wide Screen)',
            'Excel File Output (Element Name, Element Time, Comparative Value)',
            'Information Registration (Comment/Link/Narration)',
            'Category Group Selection'
        ],
        'Analysis Explorer': [
            'Analysis Data Search (Category Search, Full-text Search)',
            'Analysis Data Management',
            'Data Deletion, Editing and Movement',
            'Analysis Data Management (Multiple Tag Setting)',
            'Layer Management',
            'Favorites Function',
            'Video Thumbnail Display',
            'Video Preview Playback',
            'Detailed Video Information Display',
            'Sort Function',
            'Recycle Bin Function'
        ],
        'Aggregation': [
            'Measurement Results Aggregation (Element/Category)',
            'All Cycle Aggregation (Element/Category)',
            'Cycle Interval Scattering Display (Max. and Min. Difference)',
            'Category Color Coding Display',
            'Analysis Display',
            'Aggregation Results Sorting by Cycle'
        ],
        'Comparison': [
            'Simultaneous Playback Control (Normal/Reverse Playback, Speed)',
            'Simultaneous Playback Setting (Step/Repeat)',
            'Simultaneous Playback Before/After Comparison (Before/After Waste Elimination, Rating)',
            'Cycle Comparison (Base/Worst)',
            'Operator Comparison (Analyzed Video Comparison)',
            'Multiple Video Comparison',
            'Comparison Screen Display Switch (Up/Down, Right/Left)',
            'Info Tab Display',
            'Multiple Video Simultaneous Control (Normal/Reverse Playback, Speed)',
            'Video Caption Editing (In-Element, Max. 5 Captions)',
            'Free Marking Display',
            'Element List, Analysis Comment, External Link Switching Display',
            'Comparison Comment Editing and Display',
            'Comparison Information Input'
        ],
        'Output Function': [
            'Video Output Size Change',
            'Video Output Type Change',
            'Image Output Size Change',
            'Multiple Time Unit Output (Aggregation List)',
            'Clipboard Output',
            'Logo Output'
        ],
        'Video Conversion': [
            'Video Format Conversion',
            'Multiple Video Combination',
            'Multiple Video Combination (Differing Frame Rates)',
            'Multiple Video Combination (Differing Frame Width and Height)',
            'Video Sequence Edit Combination',
            'Generated Video Name Input'
        ],
        'Element Rearrangement': [
            'Cycle Element Rearrangement',
            'Cycle Automatic Rearrangement (Best/Worst)',
            'Multiple Analysis Element Rearrangement',
            'Element Name Rearrangement',
            'Element Name and Time Information Display',
            'Rearrangement Simulation Video Playback',
            'Rearrangement Time Simulation'
        ],
        'Other': [
            'Multiple Language Registration',
            'OTRS Operation Manual Browsing',
            'OTRS Support Site Link',
            'Program Manual Registration/Browsing',
            'Configuration Set Registration (Category/Analysis Support Registration)',
            'Logo Registration (Image File)',
            'Logo/Export (Analysis Data)',
            'Import/Export (Setting Data)',
            'Time Unit Change (sec, min, DMU, TMU)',
            'Time Decimal Place Change (0 - 3 Decimal Places)',
            'Network Settings',
            'Input/Output Folder Setting',
            'File Category Group Setting',
            'Combination Chart Type Setting',
            'Backup Function',
            'Import OTRS from Other Systems (Word, Excel, PowerPoint, etc.)',
            'Analysis Support',
            'Word Pickup',
            'Automatic Element Registration',
            'Element Copying (Single/All)',
            'Display Logo Setting',
            'Header/Footer Setting',
            'Category Editing'
        ]
    };

    const categoryColors = {
        'Analysis/Playback': '#4a6fa5',
        'Analysis Explorer': '#4a6fa5',
        'Aggregation': '#4a6fa5',
        'Comparison': '#4a6fa5',
        'Output Function': '#4a6fa5',
        'Video Conversion': '#4a6fa5',
        'Element Rearrangement': '#4a6fa5',
        'Other': '#4a6fa5'
    };

    const toggleCategory = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'var(--bg-secondary)',
            overflowY: 'auto',
            padding: '10px'
        }}>
            <h2 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                Daftar Fitur
            </h2>

            {Object.entries(features).map(([category, featureList]) => (
                <div key={category} style={{ marginBottom: '5px' }}>
                    <div
                        onClick={() => toggleCategory(category)}
                        style={{
                            backgroundColor: categoryColors[category],
                            color: 'white',
                            padding: '10px 15px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            userSelect: 'none'
                        }}
                    >
                        <span>{category}</span>
                        <span>{expandedCategory === category ? '▼' : '▶'}</span>
                    </div>

                    {expandedCategory === category && (
                        <div style={{
                            backgroundColor: '#f0f0f0',
                            padding: '10px',
                            maxHeight: '400px',
                            overflowY: 'auto'
                        }}>
                            <ul style={{
                                margin: 0,
                                padding: '0 0 0 20px',
                                listStyle: 'none'
                            }}>
                                {featureList.map((feature, index) => (
                                    <li
                                        key={index}
                                        onClick={() => onFeatureSelect && onFeatureSelect(category, feature)}
                                        style={{
                                            padding: '6px 0',
                                            color: '#333',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #ddd',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                    >
                                        <span style={{ color: '#4a6fa5' }}>●</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default FeatureMenu;
