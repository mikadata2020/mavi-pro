// Cycle Segmentation AI Engine
// Combines MediaPipe pose detection and Teachable Machine for intelligent cycle segmentation

import { detectPose, getKeypoint, calculateDistance, calculateAngle } from './poseDetector';
import { predict } from './teachableMachine';

/**
 * Extract pose features from keypoints
 * @param {Array} keypoints - Pose keypoints
 * @returns {Object} - Extracted features
 */
const extractPoseFeatures = (keypoints) => {
    if (!keypoints || keypoints.length === 0) return null;

    // Get key body points
    const leftWrist = getKeypoint(keypoints, 'left_wrist');
    const rightWrist = getKeypoint(keypoints, 'right_wrist');
    const leftElbow = getKeypoint(keypoints, 'left_elbow');
    const rightElbow = getKeypoint(keypoints, 'right_elbow');
    const leftShoulder = getKeypoint(keypoints, 'left_shoulder');
    const rightShoulder = getKeypoint(keypoints, 'right_shoulder');
    const leftHip = getKeypoint(keypoints, 'left_hip');
    const rightHip = getKeypoint(keypoints, 'right_hip');

    // Calculate angles
    const leftElbowAngle = leftShoulder && leftElbow && leftWrist
        ? calculateAngle(leftShoulder, leftElbow, leftWrist)
        : 0;
    const rightElbowAngle = rightShoulder && rightElbow && rightWrist
        ? calculateAngle(rightShoulder, rightElbow, rightWrist)
        : 0;

    // Calculate distances
    const wristDistance = leftWrist && rightWrist
        ? calculateDistance(leftWrist, rightWrist)
        : 0;

    return {
        keypoints: {
            leftWrist,
            rightWrist,
            leftElbow,
            rightElbow,
            leftShoulder,
            rightShoulder,
            leftHip,
            rightHip
        },
        angles: {
            leftElbow: leftElbowAngle,
            rightElbow: rightElbowAngle
        },
        distances: {
            wrists: wristDistance
        },
        velocity: {} // Placeholder for velocity calculation
    };
};

/**
 * Cycle Segmentation Engine Class
 * Handles video analysis, cycle detection, and comparison
 */
class CycleSegmentationEngine {
    constructor() {
        this.goldenCycle = null;
        this.tmModel = null;
        this.poseDetector = null;
    }

    /**
     * Set the golden cycle (reference cycle)
     * @param {Object} goldenCycleData - Reference cycle data with poses and actions
     */
    setGoldenCycle(goldenCycleData) {
        this.goldenCycle = goldenCycleData;
    }

    /**
     * Set Teachable Machine model
     * @param {Object} model - TM model instance
     */
    setTeachableMachineModel(model) {
        this.tmModel = model;
    }

    /**
     * Analyze video frame by frame
     * @param {HTMLVideoElement} video - Video element to analyze
     * @param {Function} progressCallback - Progress callback (0-1)
     * @param {Object} options - Analysis options
     * @returns {Promise<Array>} - Array of frame data
     */
    async analyzeVideo(video, progressCallback, options = {}) {
        const {
            fps = 30,
            useTeachableMachine = false
        } = options;

        const duration = video.duration;
        const totalFrames = Math.floor(duration * fps);
        const frameData = [];

        for (let frameNum = 0; frameNum < totalFrames; frameNum++) {
            const currentTime = frameNum / fps;
            video.currentTime = currentTime;

            // Wait for video to seek
            await new Promise(resolve => {
                video.onseeked = resolve;
            });

            // Detect pose
            const poses = await detectPose(video);
            let actionLabel = null;
            let actionConfidence = 0;

            if (poses && poses.length > 0) {
                const pose = poses[0];

                // Extract motion features
                const features = extractPoseFeatures(pose.keypoints);

                // Classify action using TM or rule-based
                if (useTeachableMachine && this.tmModel) {
                    const prediction = await predict(this.tmModel, video);
                    if (prediction) {
                        actionLabel = prediction.bestClass;
                        actionConfidence = prediction.accuracy;
                    }
                } else {
                    // Rule-based action classification
                    const action = this._classifyActionFromPose(pose, features);
                    actionLabel = action.label;
                    actionConfidence = action.confidence;
                }

                frameData.push({
                    frameNumber: frameNum,
                    time: currentTime,
                    pose: pose,
                    features: features,
                    action: actionLabel,
                    actionConfidence: actionConfidence,
                    motionIntensity: this._calculateMotionIntensity(features)
                });
            } else {
                // No pose detected
                frameData.push({
                    frameNumber: frameNum,
                    time: currentTime,
                    pose: null,
                    features: null,
                    action: 'No Person Detected',
                    actionConfidence: 0,
                    motionIntensity: 0
                });
            }

            // Update progress
            if (progressCallback) {
                progressCallback((frameNum + 1) / totalFrames);
            }
        }

        return frameData;
    }

    /**
     * Detect cycle boundaries from frame data
     * @param {Array} frameData - Frame analysis data
     * @param {Object} options - Detection options
     * @returns {Array} - Array of detected cycles
     */
    detectCycles(frameData, options = {}) {
        const {
            minCycleDuration = 1.0, // seconds
            threshold = 20, // motion intensity threshold
            useGoldenCycle = true
        } = options;

        if (!frameData || frameData.length === 0) {
            return [];
        }

        const cycles = [];
        let currentCycleStart = null;
        let currentCycleFrames = [];

        for (let i = 0; i < frameData.length; i++) {
            const frame = frameData[i];
            const motionIntensity = frame.motionIntensity || 0;

            // Detect cycle start (motion intensity crosses threshold going up)
            if (motionIntensity > threshold && currentCycleStart === null) {
                currentCycleStart = i;
                currentCycleFrames = [frame];
            }
            // Collect frames during cycle
            else if (currentCycleStart !== null && motionIntensity > threshold) {
                currentCycleFrames.push(frame);
            }
            // Detect cycle end (motion intensity goes below threshold)
            else if (currentCycleStart !== null && motionIntensity <= threshold) {
                const startFrame = frameData[currentCycleStart];
                const endFrame = frame;
                const duration = frame.time - startFrame.time;

                // Check minimum duration
                if (duration >= minCycleDuration) {
                    const cycle = {
                        cycleNumber: cycles.length + 1,
                        startTime: startFrame.time,
                        endTime: endFrame.time,
                        duration: duration,
                        frames: currentCycleFrames,
                        avgMotion: this._calculateAverageMotion(currentCycleFrames),
                        actions: this._extractActionSequence(currentCycleFrames)
                    };

                    // Compare with golden cycle if available
                    if (useGoldenCycle && this.goldenCycle) {
                        const similarity = this.compareCycles(this.goldenCycle, cycle);
                        cycle.similarityScore = similarity.score;
                        cycle.deviations = similarity.deviations;
                    }

                    cycles.push(cycle);
                }

                // Reset for next cycle
                currentCycleStart = null;
                currentCycleFrames = [];
            }
        }

        return cycles;
    }

    /**
     * Compare two cycles and calculate similarity
     * @param {Object} cycle1 - First cycle
     * @param {Object} cycle2 - Second cycle
     * @returns {Object} - Comparison result with score and deviations
     */
    compareCycles(cycle1, cycle2) {
        if (!cycle1 || !cycle2) {
            return { score: 0, deviations: {} };
        }

        const deviations = {};
        let totalScore = 0;
        let scoreCount = 0;

        // Compare duration
        const durationDiff = Math.abs(cycle1.duration - cycle2.duration);
        const durationScore = Math.max(0, 100 - (durationDiff / cycle1.duration) * 100);
        deviations.durationDiff = durationDiff;
        totalScore += durationScore;
        scoreCount++;

        // Compare pose sequences
        if (cycle1.frames && cycle2.frames) {
            const poseScore = this._comparePoseSequences(cycle1.frames, cycle2.frames);
            deviations.poseDeviation = 100 - poseScore;
            totalScore += poseScore;
            scoreCount++;
        }

        // Compare action sequences
        if (cycle1.actions && cycle2.actions) {
            const actionScore = this._compareActionSequences(cycle1.actions, cycle2.actions);
            deviations.actionDeviation = 100 - actionScore;
            totalScore += actionScore;
            scoreCount++;
        }

        // Compare motion patterns
        if (cycle1.avgMotion && cycle2.avgMotion) {
            const motionDiff = Math.abs(cycle1.avgMotion - cycle2.avgMotion);
            const motionScore = Math.max(0, 100 - (motionDiff / cycle1.avgMotion) * 100);
            deviations.motionDiff = motionDiff;
            totalScore += motionScore;
            scoreCount++;
        }

        const score = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

        return {
            score: score,
            deviations: deviations,
            isConsistent: score >= 80 // 80% similarity threshold
        };
    }

    /**
     * Calculate statistics for detected cycles
     * @param {Array} cycles - Array of cycles
     * @returns {Object} - Statistics
     */
    calculateStatistics(cycles) {
        if (!cycles || cycles.length === 0) {
            return {
                totalCycles: 0,
                avgDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                consistency: 0,
                standardDeviation: 0
            };
        }

        const durations = cycles.map(c => c.duration);
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);

        // Calculate standard deviation
        const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
        const stdDev = Math.sqrt(variance);

        // Consistency score (inverse of coefficient of variation)
        const coefficientOfVariation = (stdDev / avgDuration) * 100;
        const consistency = Math.max(0, Math.min(100, 100 - coefficientOfVariation));

        // Calculate average similarity if golden cycle exists
        let avgSimilarity = null;
        if (cycles.some(c => c.similarityScore !== undefined)) {
            const similarities = cycles.filter(c => c.similarityScore !== undefined).map(c => c.similarityScore);
            avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
        }

        return {
            totalCycles: cycles.length,
            avgDuration: avgDuration.toFixed(2),
            minDuration: minDuration.toFixed(2),
            maxDuration: maxDuration.toFixed(2),
            consistency: Math.round(consistency),
            standardDeviation: stdDev.toFixed(2),
            avgSimilarity: avgSimilarity !== null ? Math.round(avgSimilarity) : null
        };
    }

    // ============================================
    // PRIVATE HELPER METHODS
    // ============================================

    /**
     * Rule-based action classification from pose
     * @private
     */
    _classifyActionFromPose(pose, features) {
        if (!features) {
            return { label: 'Unknown', confidence: 0 };
        }

        // Simple rule-based classification
        const { leftWrist, rightWrist, leftElbow, rightElbow } = features.keypoints || {};

        // Check for reaching
        if (leftWrist && rightWrist) {
            const wristHeight = Math.max(leftWrist.y, rightWrist.y);
            if (wristHeight < 0.3) { // Arms extended upward
                return { label: 'Reaching', confidence: 0.8 };
            }
        }

        // Check for grasping (hands close together)
        if (leftWrist && rightWrist) {
            const distance = Math.hypot(leftWrist.x - rightWrist.x, leftWrist.y - rightWrist.y);
            if (distance < 0.2) {
                return { label: 'Grasping', confidence: 0.75 };
            }
        }

        // Check for assembly (arms bent at elbows)
        if (leftElbow && rightElbow) {
            const leftAngle = Math.abs(leftElbow.angle || 0);
            const rightAngle = Math.abs(rightElbow.angle || 0);
            if (leftAngle < 120 && rightAngle < 120) {
                return { label: 'Assembling', confidence: 0.7 };
            }
        }

        return { label: 'Working', confidence: 0.5 };
    }

    /**
     * Calculate motion intensity from pose features
     * @private
     */
    _calculateMotionIntensity(features) {
        if (!features || !features.velocity) {
            return 0;
        }

        // Calculate total velocity magnitude
        const totalVelocity = Object.values(features.velocity).reduce((sum, vel) => {
            return sum + Math.hypot(vel.x || 0, vel.y || 0);
        }, 0);

        return totalVelocity;
    }

    /**
     * Calculate average motion for a set of frames
     * @private
     */
    _calculateAverageMotion(frames) {
        if (!frames || frames.length === 0) return 0;

        const totalMotion = frames.reduce((sum, frame) => sum + (frame.motionIntensity || 0), 0);
        return (totalMotion / frames.length).toFixed(2);
    }

    /**
     * Extract action sequence from frames
     * @private
     */
    _extractActionSequence(frames) {
        if (!frames || frames.length === 0) return [];

        // Group consecutive same actions
        const sequence = [];
        let currentAction = null;
        let actionStartTime = null;

        frames.forEach((frame, index) => {
            if (frame.action !== currentAction) {
                // Save previous action
                if (currentAction !== null) {
                    sequence.push({
                        action: currentAction,
                        startTime: actionStartTime,
                        endTime: frame.time,
                        duration: frame.time - actionStartTime
                    });
                }

                // Start new action
                currentAction = frame.action;
                actionStartTime = frame.time;
            }

            // Last frame
            if (index === frames.length - 1) {
                sequence.push({
                    action: currentAction,
                    startTime: actionStartTime,
                    endTime: frame.time,
                    duration: frame.time - actionStartTime
                });
            }
        });

        return sequence;
    }

    /**
     * Compare two pose sequences
     * @private
     */
    _comparePoseSequences(frames1, frames2) {
        // Use Dynamic Time Warping (DTW) for sequence comparison
        // Simplified version - compare key poses at similar time points

        const sampleCount = Math.min(frames1.length, frames2.length, 20); // Sample 20 points
        const step1 = Math.floor(frames1.length / sampleCount);
        const step2 = Math.floor(frames2.length / sampleCount);

        let totalSimilarity = 0;

        for (let i = 0; i < sampleCount; i++) {
            const frame1 = frames1[i * step1];
            const frame2 = frames2[i * step2];

            if (frame1 && frame2 && frame1.pose && frame2.pose) {
                const similarity = this._comparePoses(frame1.pose, frame2.pose);
                totalSimilarity += similarity;
            }
        }

        return totalSimilarity / sampleCount;
    }

    /**
     * Compare two individual poses
     * @private
     */
    _comparePoses(pose1, pose2) {
        if (!pose1 || !pose2 || !pose1.keypoints || !pose2.keypoints) {
            return 0;
        }

        const keypoints1 = pose1.keypoints;
        const keypoints2 = pose2.keypoints;

        let totalDistance = 0;
        let count = 0;

        // Compare each keypoint
        for (let i = 0; i < Math.min(keypoints1.length, keypoints2.length); i++) {
            const kp1 = keypoints1[i];
            const kp2 = keypoints2[i];

            if (kp1.score > 0.3 && kp2.score > 0.3) { // Only compare confident keypoints
                const distance = Math.hypot(kp1.x - kp2.x, kp1.y - kp2.y);
                totalDistance += distance;
                count++;
            }
        }

        if (count === 0) return 0;

        const avgDistance = totalDistance / count;

        // Convert distance to similarity score (0-100)
        // Assuming max distance of 1.0 (normalized coordinates)
        const similarity = Math.max(0, 100 - (avgDistance * 100));

        return similarity;
    }

    /**
     * Compare two action sequences
     * @private
     */
    _compareActionSequences(actions1, actions2) {
        if (!actions1 || !actions2 || actions1.length === 0 || actions2.length === 0) {
            return 0;
        }

        // Calculate sequence similarity using Levenshtein distance
        const seq1 = actions1.map(a => a.action);
        const seq2 = actions2.map(a => a.action);

        const distance = this._levenshteinDistance(seq1, seq2);
        const maxLength = Math.max(seq1.length, seq2.length);

        const similarity = Math.max(0, 100 - (distance / maxLength) * 100);

        return similarity;
    }

    /**
     * Calculate Levenshtein distance between two sequences
     * @private
     */
    _levenshteinDistance(seq1, seq2) {
        const matrix = [];

        for (let i = 0; i <= seq2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= seq1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= seq2.length; i++) {
            for (let j = 1; j <= seq1.length; j++) {
                if (seq2[i - 1] === seq1[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[seq2.length][seq1.length];
    }
}

export default CycleSegmentationEngine;
