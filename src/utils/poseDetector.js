/**
 * Pose Detector
 * Uses TensorFlow.js MoveNet for real-time pose detection
 */

import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

class PoseDetector {
    constructor() {
        this.detector = null;
        this.isReady = false;
        this.modelType = 'MoveNet.SinglePose.Lightning'; // Fast but less accurate
        // Alternative: 'MoveNet.SinglePose.Thunder' for better accuracy
    }

    /**
     * Initialize the pose detector
     */
    async initialize() {
        try {
            console.log('Initializing PoseDetector...');

            // Force WebGL backend
            try {
                await tf.setBackend('webgl');
                await tf.ready();
                console.log('TensorFlow.js backend set to:', tf.getBackend());
            } catch (backendError) {
                console.warn('Failed to set WebGL backend, trying CPU fallback:', backendError);
                try {
                    await tf.setBackend('cpu');
                    await tf.ready();
                    console.log('TensorFlow.js backend set to: cpu');
                } catch (cpuError) {
                    console.error('Failed to set any backend:', cpuError);
                    throw new Error('No TensorFlow backend available');
                }
            }

            console.log('Loading MoveNet model...');

            const detectorConfig = {
                modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
                enableSmoothing: true
            };

            this.detector = await poseDetection.createDetector(
                poseDetection.SupportedModels.MoveNet,
                detectorConfig
            );

            this.isReady = true;
            console.log('✓ MoveNet model loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load MoveNet model:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                backend: tf.getBackend()
            });
            return false;
        }
    }

    /**
     * Detect poses in a video frame
     * @param {HTMLVideoElement|HTMLImageElement|HTMLCanvasElement} input - Input element
     * @returns {Promise<Array>} Array of detected poses with keypoints
     */
    async detectPose(input) {
        if (!this.isReady || !this.detector) {
            console.warn('Pose detector not ready');
            return null;
        }

        try {
            const poses = await this.detector.estimatePoses(input);
            return poses.length > 0 ? poses[0] : null;
        } catch (error) {
            console.error('Pose detection error:', error);
            return null;
        }
    }

    /**
     * Get keypoint by name
     * @param {Object} pose - Detected pose
     * @param {string} name - Keypoint name (e.g., 'left_shoulder', 'right_elbow')
     * @returns {Object|null} Keypoint with x, y, score
     */
    getKeypoint(pose, name) {
        if (!pose || !pose.keypoints) return null;

        const keypoint = pose.keypoints.find(kp => kp.name === name);
        return keypoint && keypoint.score > 0.3 ? keypoint : null;
    }

    /**
     * Get all keypoints with minimum confidence
     * @param {Object} pose - Detected pose
     * @param {number} minConfidence - Minimum confidence score (0-1)
     * @returns {Object} Object with keypoint names as keys
     */
    getKeypoints(pose, minConfidence = 0.3) {
        if (!pose || !pose.keypoints) return {};

        const keypoints = {};
        pose.keypoints.forEach(kp => {
            if (kp.score >= minConfidence) {
                keypoints[kp.name] = {
                    x: kp.x,
                    y: kp.y,
                    score: kp.score
                };
            }
        });

        return keypoints;
    }

    /**
     * Check if pose has required keypoints for ergonomic analysis
     * @param {Object} pose - Detected pose
     * @returns {boolean} True if all required keypoints are present
     */
    hasRequiredKeypoints(pose) {
        const required = [
            'left_shoulder', 'right_shoulder',
            'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist',
            'left_hip', 'right_hip',
            'nose'
        ];

        const keypoints = this.getKeypoints(pose, 0.3);
        return required.every(name => keypoints[name]);
    }

    /**
     * Dispose of the detector
     */
    dispose() {
        if (this.detector) {
            this.detector.dispose();
            this.detector = null;
            this.isReady = false;
        }
    }
}

/**
 * MoveNet Keypoint Names (17 keypoints)
 */
export const KEYPOINT_NAMES = {
    NOSE: 'nose',
    LEFT_EYE: 'left_eye',
    RIGHT_EYE: 'right_eye',
    LEFT_EAR: 'left_ear',
    RIGHT_EAR: 'right_ear',
    LEFT_SHOULDER: 'left_shoulder',
    RIGHT_SHOULDER: 'right_shoulder',
    LEFT_ELBOW: 'left_elbow',
    RIGHT_ELBOW: 'right_elbow',
    LEFT_WRIST: 'left_wrist',
    RIGHT_WRIST: 'right_wrist',
    LEFT_HIP: 'left_hip',
    RIGHT_HIP: 'right_hip',
    LEFT_KNEE: 'left_knee',
    RIGHT_KNEE: 'right_knee',
    LEFT_ANKLE: 'left_ankle',
    RIGHT_ANKLE: 'right_ankle'
};

export default PoseDetector;
