export const RULE_TYPES = {
    POSE_ANGLE: { label: 'Joint Angle', description: 'Angle between 3 joints (e.g. Elbow Flexion)' },
    POSE_RELATION: { label: 'Pose Relation (XYZ)', description: 'Compare joint positions or relative distances' },
    POSE_VELOCITY: { label: 'Pose Velocity (Speed)', description: 'Check speed of a joint' },
    OBJECT_PROXIMITY: { label: 'Object Proximity', description: 'Distance to an object' },
    POSE_MATCHING: { label: 'Golden Pose Match', description: 'Similarity to reference pose' }
};

export const JOINTS = [
    "nose", "left_eye_inner", "left_eye", "left_eye_outer", "right_eye_inner", "right_eye", "right_eye_outer",
    "left_ear", "right_ear", "mouth_left", "mouth_right", "left_shoulder", "right_shoulder",
    "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_pinky", "right_pinky",
    "left_index", "right_index", "left_thumb", "right_thumb", "left_hip", "right_hip",
    "left_knee", "right_knee", "left_ankle", "right_ankle", "left_heel", "right_heel",
    "left_foot_index", "right_foot_index"
];
