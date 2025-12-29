/**
 * InferenceEngine.js
 * Runtime engine for executing Studio Motion Models.
 * Handles:
 * 1. Object/Pose Tracking (Simplified ByteTrack/IOU)
 * 2. Finite State Machine (FSM) execution per tracked entity
 * 3. Rule Evaluation (Pose Angles, Object Proximity, etc.)
 * 4. Event Logging (Cycle Times)
 */

import AngleCalculator from '../angleCalculator';
import { getKeypoint } from '../poseDetector';
import PoseNormalizer from './PoseNormalizer';

export default class InferenceEngine {
    constructor() {
        this.model = null;
        this.activeTracks = new Map(); // Map<trackId, { state, enterTime, history, ... }>
        this.logs = [];
        this.timelineEvents = []; // Structured events: { trackId, state, start, end }
        this.nextTrackId = 1;
        this.frameCount = 0;
        this.angleCalculator = new AngleCalculator();
    }

    /**
     * Load a motion model definition
     * @param {Object} model - The model defined in Studio
     */
    loadModel(model) {
        if (!model || !model.statesList || !model.statesList.length) {
            console.warn("InferenceEngine: Invalid model loaded");
            return;
        }
        this.model = model;
        this.reset();
        console.log(`InferenceEngine: Loaded model "${model.name}" with ${model.statesList.length} states`);
    }

    reset() {
        this.activeTracks.clear();
        this.logs = [];
        this.frameCount = 0;
        this.nextTrackId = 1;
    }

    /**
     * Main processing loop for a single frame
     * @param {Object} data - Contains { poses, objects, hands, timestamp }
     * @returns {Object} - Processing results (tracks, logs)
     */
    processFrame(data) {
        if (!this.model) return { tracks: [], logs: [] };

        const { poses = [], objects = [], hands = [], timestamp } = data;
        this.frameCount++;

        // 1. TRACKING (Simplified: Assuming single operator for now or simple distance matching)
        // For this MVP, we will assume the primary pose (highest confidence) is the operator.
        // TODO: Implement multi-person tracking if needed.

        const primaryPose = poses.length > 0 ? poses[0] : null;

        if (primaryPose) {
            let trackId = 1; // Default to single user ID 1

            // Get or Initialize Track State
            if (!this.activeTracks.has(trackId)) {
                this.activeTracks.set(trackId, {
                    id: trackId,
                    currentState: this.model.statesList[0].id, // Start State
                    stateEnterTime: timestamp,
                    lastUpdate: timestamp
                });
                this.addLog(trackId, timestamp, "System", `Operator detected. Starting in ${this.model.statesList[0].name}`);
            }

            const track = this.activeTracks.get(trackId);

            // 1.1 Calculate Velocity (Instantaneous Speed)
            const dt = (timestamp - track.lastUpdate) / 1000;
            if (dt > 0 && dt < 1.0 && track.prevPose) {
                // We use raw coords for velocity for now, or match model mode?
                // For robustness, let's use the Raw Screen coords always for "Movement Speed"
                // unless user specifically wants "Relative Speed". Raw is safer for "Is moving?".
                track.velocities = this.calculateVelocities(track.prevPose, primaryPose, dt);
            } else {
                track.velocities = {};
            }

            track.lastUpdate = timestamp;
            track.prevPose = primaryPose;

            // 2. FSM EXECUTION
            this.updateFSM(track, primaryPose, objects, hands, timestamp);
        }

        // Return current state of all tracks for UI rendering
        return {
            tracks: Array.from(this.activeTracks.values()).map(t => ({
                id: t.id,
                state: this.getStateName(t.currentState),
                duration: ((timestamp - t.stateEnterTime) / 1000).toFixed(1) + 's'
            })),
            logs: this.logs,
            timelineEvents: this.timelineEvents
        };
    }

    updateFSM(track, pose, objects, hands, timestamp) {
        const currentStateId = track.currentState;
        const currentState = this.model.statesList.find(s => s.id === currentStateId);

        // --- STRICT REFERENCE DATASET LOGIC ---
        // If the current state has a reference pose/ROI, we check for "Compliance" with the current state FIRST.
        // If compliant for > minDuration, we look for the next sequence step.

        let complianceMet = true;

        // 1. Check ROI Compliance (if defined)
        if (currentState && currentState.roi) {
            if (!this.checkROI(currentState.roi, pose)) complianceMet = false;
        }

        // 2. Check Pose Similarity (if defined)
        if (currentState && currentState.referencePose && complianceMet) {
            const similarity = PoseNormalizer.calculateSimilarity(pose.keypoints, currentState.referencePose);
            // Default strict threshold 0.75
            if (similarity < 0.75) complianceMet = false;
        }

        // 3. Cycle/Duration Logic
        if (complianceMet && (currentState.roi || currentState.referencePose)) {
            // User is correctly performing the current state action
            if (!track.matchStartTime) track.matchStartTime = timestamp;
            const duration = (timestamp - track.matchStartTime) / 1000;

            // Check if duration met to AUTO-TRANSITION to next sequence step
            const reqDuration = currentState.minDuration || 0.5; // Default 0.5s stability

            if (duration >= reqDuration) {
                // Try to find the "next" state in sequence
                // Assuming linear sequence for now based on statesList order
                const currentIndex = this.model.statesList.findIndex(s => s.id === currentStateId);
                const nextState = this.model.statesList[currentIndex + 1];

                if (nextState) {
                    this.transitionTo(track, nextState.id, timestamp, "Sequence Step Complete");
                    return;
                } else {
                    // End of cycle or stay in final state?
                    // Logic: If already completed, maybe don't log spam
                    if (track.currentState !== 's_complete') {
                        this.addLog(track.id, timestamp, "Cycle Complete", `Cycle finished in ${((timestamp - track.stateEnterTime) / 1000).toFixed(1)}s`);
                        // Optional: loop or specific end state
                    }
                }
            }
        } else {
            // Broken compliance - reset timer? or just pause it?
            // Strict mode: Reset timer.
            track.matchStartTime = null;
        }

        // --- TRADITIONAL TRANSITION RULES (Fallback/Hybrid) ---
        // Keep existing logic for rule-based transitions (e.g. standard FSM models)
        if (this.model.transitions && this.model.transitions.length > 0) {
            const possibleTransitions = this.model.transitions.filter(t => t.from === currentStateId);

            // Initialize candidate tracker if not present
            if (!track.transitionCandidates) track.transitionCandidates = {};

            // To properly handle mutual exclusion, we ideally check ALL before committing?
            // But standard FSM usually takes the first valid one (priority by order).

            for (const transition of possibleTransitions) {
                // If condition met
                if (this.evaluateCondition(transition.condition, pose, objects, hands, track)) {

                    // Check Hold Time (Hysteresis)
                    const holdTime = (transition.condition.holdTime || 0) * 1000; // Convert to ms

                    if (holdTime > 0) {
                        if (!track.transitionCandidates[transition.id]) {
                            // Start timer
                            track.transitionCandidates[transition.id] = timestamp;
                        } else {
                            // Check timer
                            const elapsedTime = timestamp - track.transitionCandidates[transition.id];
                            if (elapsedTime >= holdTime) {
                                this.transitionTo(track, transition.to, timestamp, `Rule Triggered (Held ${(elapsedTime / 1000).toFixed(1)}s)`);
                                track.transitionCandidates = {}; // Clear candidates
                                break;
                            }
                        }
                    } else {
                        // Instant Transition
                        this.transitionTo(track, transition.to, timestamp, "Rule Triggered");
                        track.transitionCandidates = {};
                        break;
                    }
                } else {
                    // Condition broken, reset timer for this transition
                    if (track.transitionCandidates[transition.id]) {
                        delete track.transitionCandidates[transition.id];
                    }
                }
            }
        }
    }

    transitionTo(track, newStateId, timestamp, reason) {
        const fromState = this.getStateName(track.currentState);
        const toState = this.getStateName(newStateId);

        // Record the end of the previous state and push to timelineEvents
        this.timelineEvents.push({
            trackId: track.id,
            state: this.getStateName(track.currentState), // The state that just finished
            startTime: track.stateEnterTime,
            endTime: timestamp,
            duration: timestamp - track.stateEnterTime
        });

        this.addLog(track.id, timestamp, "Transition", `${fromState} -> ${toState} (${reason})`);

        track.currentState = newStateId;
        track.stateEnterTime = timestamp; // Reset start time for new state
        track.matchStartTime = null; // Reset duration timer
    }

    checkROI(roi, pose) {
        // defined as {x, y, width, height} (normalized 0-1)
        // Check if wrists are in ROI (Primary interaction points)
        const rightWrist = getKeypoint(pose.keypoints, 'right_wrist');
        const leftWrist = getKeypoint(pose.keypoints, 'left_wrist');

        const checkPoint = (pt) => {
            if (!pt || pt.score < 0.3) return false;
            // ROI is 0-1 relative to frame
            return pt.x >= roi.x && pt.x <= (roi.x + roi.width) &&
                pt.y >= roi.y && pt.y <= (roi.y + roi.height);
        };

        // If ROI Check is loose (either hand)
        return checkPoint(rightWrist) || checkPoint(leftWrist);
    }

    evaluateCondition(condition, pose, objects, hands, track) {
        if (!condition || !condition.rules || condition.rules.length === 0) return false;

        const operator = condition.operator || 'AND';

        // Helper to evaluate a rule item (could be a single rule or a nested group)
        const evaluateItem = (item) => {
            let result = false;
            // Check if it's a Group (has 'rules' array)
            if (item.rules && item.rules.length > 0) {
                result = this.evaluateCondition(item, pose, objects, hands, track);
            } else {
                result = this.checkRule(item, pose, objects, hands, track);
            }
            // Handle NOT operator (Invert)
            if (item.invert) return !result;
            return result;
        };

        if (operator === 'OR') {
            return condition.rules.some(evaluateItem);
        } else {
            // Default AND
            return condition.rules.every(evaluateItem);
        }
    }

    checkRule(rule, pose, objects, hands, track) {
        const { type, params } = rule;

        switch (type) {
            case 'POSE_ANGLE':
                return this.checkPoseAngle(params, pose);
            case 'POSE_RELATION':
                return this.checkPoseRelation(params, pose);
            case 'POSE_VELOCITY':
                return this.checkPoseVelocity(params, track);
            case 'OBJECT_PROXIMITY':
                return this.checkObjectProximity(params, pose, objects);
            case 'POSE_MATCHING':
                return this.checkPoseMatching(rule, pose);
            case 'HAND_GESTURE':
                return this.checkHandGesture(params, hands);
            case 'HAND_PROXIMITY':
                return this.checkHandProximity(params, hands, pose);
            default:
                return false;
        }
    }

    checkPoseVelocity(params, track) {
        const { joint, operator, value } = params;
        // velocities is map: { nose: 0.1, left_wrist: 1.5, ... }
        if (!track || !track.velocities || typeof track.velocities[joint] === 'undefined') return false;

        const speed = track.velocities[joint];

        switch (operator) {
            case '>': return speed > value;
            case '<': return speed < value;
            case '>=': return speed >= value;
            case '<=': return speed <= value;
            default: return false;
        }
    }

    calculateVelocities(prevPose, currPose, dt) {
        if (dt <= 0) return {};
        const vels = {};
        currPose.keypoints.forEach(curr => {
            const prev = prevPose.keypoints.find(k => k.name === curr.name);
            if (prev) {
                // Distance in screen units (0-1 usually).
                // Velocity is Units per Second.
                // e.g. 0.1 means moving 10% of screen height per second.
                const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
                vels[curr.name] = dist / dt;
            }
        });
        return vels;
    }

    checkPoseRelation(params, pose) {
        const { jointA, jointB, component, operator, targetType, value } = params;

        // Determine Coordinate System
        let keypointsToUse = pose.keypoints; // Default to raw screen coords

        // If Logic is Body-Centric (Default unless explicitly 'screen')
        if (this.model && this.model.coordinateSystem !== 'screen') {
            keypointsToUse = PoseNormalizer.normalize(pose.keypoints);
        }

        const pA = getKeypoint(keypointsToUse, jointA);

        if (!pA) return false;

        let valA = pA[component || 'y']; // Default to Y check (height)
        let valB = value;

        if (targetType === 'POINT' && jointB) {
            const pB = getKeypoint(keypointsToUse, jointB);
            if (!pB) return false;
            valB = pB[component || 'y'];
        }

        // Normalization note: 
        // Screen: x, y are 0-1.
        // Body: x, y are relative (~ -1 to 1). (0,0) is Hip Center.

        switch (operator) {
            case '>': return valA > valB;
            case '<': return valA < valB;
            case '>=': return valA >= valB;
            case '<=': return valA <= valB;
            case '=': return Math.abs(valA - valB) < 0.05; // 5% tolerance
            case '!=': return Math.abs(valA - valB) > 0.05;
            default: return false;
        }
    }

    checkPoseMatching(rule, currentPose) {
        // Rule params should contain { targetStateId, threshold }
        // Actually, transitions usually go TO a state. We should check if we match the TO state's reference.
        // But the rule definitions in RuleEditor might need adjustment.
        // For now, let's assume the rule explicitly stores the referencePose or points to the state ID.

        const { targetStateId, threshold = 0.8 } = rule.params;
        const targetState = this.model.statesList.find(s => s.id === targetStateId);

        if (!targetState || !targetState.referencePose) return false;

        const similarity = PoseNormalizer.calculateSimilarity(currentPose.keypoints, targetState.referencePose);
        return similarity >= threshold;
    }

    checkPoseAngle(params, pose) {
        const { jointA, jointB, jointC, operator, value } = params;

        // PoseNet keypoints are usually an array. getKeypoint helper finds them by name.
        const pA = getKeypoint(pose.keypoints, jointA);
        const pB = getKeypoint(pose.keypoints, jointB);
        const pC = getKeypoint(pose.keypoints, jointC);

        if (!pA || !pB || !pC) return false;

        const angle = this.angleCalculator.calculateAngle(pA, pB, pC);

        switch (operator) {
            case '>': return angle > value;
            case '<': return angle < value;
            case '=': return Math.abs(angle - value) < 5; // Tolerance
            default: return false;
        }
    }

    checkObjectProximity(params, pose, objects) {
        // TODO: Implement object distance logic
        // Need bbox center calculation
        return false;
    }

    checkHandGesture(params, hands) {
        const { gesture, handedness = 'any' } = params;
        if (!hands || hands.length === 0) return false;

        // Import gesture detection from handDetector
        // For now, simple implementation
        const detectSimpleGesture = (landmarks) => {
            if (!landmarks || landmarks.length !== 21) return 'unknown';

            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const ringTip = landmarks[16];
            const pinkyTip = landmarks[20];

            const indexMCP = landmarks[5];
            const middleMCP = landmarks[9];
            const ringMCP = landmarks[13];
            const pinkyMCP = landmarks[17];

            const isIndexUp = indexTip.y < indexMCP.y;
            const isMiddleUp = middleTip.y < middleMCP.y;
            const isRingUp = ringTip.y < ringMCP.y;
            const isPinkyUp = pinkyTip.y < pinkyMCP.y;

            if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) return 'pointing';
            if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) return 'peace';
            if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) return 'open_palm';
            if (!isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) return 'fist';

            return 'unknown';
        };

        return hands.some(hand => {
            const detectedGesture = detectSimpleGesture(hand);
            return detectedGesture === gesture;
        });
    }

    checkHandProximity(params, hands, pose) {
        const { landmark, bodyPart, distance, operator = '<' } = params;
        if (!hands || hands.length === 0 || !pose) return false;

        // Get body part keypoint
        const bodyKeypoint = getKeypoint(pose.keypoints, bodyPart);
        if (!bodyKeypoint) return false;

        // Check if any hand landmark is within distance
        return hands.some(hand => {
            const handLandmark = hand[landmark] || hand[0]; // Default to wrist
            if (!handLandmark) return false;

            const dist = Math.hypot(
                handLandmark.x - bodyKeypoint.x,
                handLandmark.y - bodyKeypoint.y
            );

            switch (operator) {
                case '<': return dist < distance;
                case '>': return dist > distance;
                case '<=': return dist <= distance;
                case '>=': return dist >= distance;
                default: return false;
            }
        });
    }

    getStateName(id) {
        const state = this.model.statesList.find(s => s.id === id);
        return state ? state.name : id;
    }

    addLog(trackId, timestamp, type, message) {
        this.logs.unshift({
            id: `log_${Date.now()}_${Math.random()}`,
            timestamp: new Date().toLocaleTimeString(),
            trackId,
            type,
            message
        });
        // Keep logs size manageable
        if (this.logs.length > 50) this.logs.pop();
    }
}

// Export instance for runtime usage
export const inferenceEngine = new InferenceEngine();
