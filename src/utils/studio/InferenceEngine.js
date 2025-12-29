/**
 * InferenceEngine.js
 * Runtime engine for executing Studio Motion Models.
 */

import AngleCalculator from '../angleCalculator';
import { getKeypoint } from '../poseDetector';
import PoseNormalizer from './PoseNormalizer';

class InferenceEngine {
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
     */
    processFrame(data) {
        if (!this.model) return { tracks: [], logs: [] };

        const { poses = [], objects = [], hands = [], timestamp } = data;
        this.frameCount++;

        const primaryPose = poses.length > 0 ? poses[0] : null;

        if (primaryPose) {
            let trackId = 1;

            if (!this.activeTracks.has(trackId)) {
                this.activeTracks.set(trackId, {
                    id: trackId,
                    currentState: this.model.statesList[0].id,
                    stateEnterTime: timestamp,
                    lastUpdate: timestamp
                });
                this.addLog(trackId, timestamp, "System", `Operator detected. Starting in ${this.model.statesList[0].name}`);
            }

            const track = this.activeTracks.get(trackId);
            const dt = (timestamp - track.lastUpdate) / 1000;

            if (dt > 0 && dt < 1.0 && track.prevPose) {
                track.velocities = this.calculateVelocities(track.prevPose, primaryPose, dt);
            } else {
                track.velocities = {};
            }

            track.lastUpdate = timestamp;
            track.prevPose = primaryPose;

            this.updateFSM(track, primaryPose, objects, hands, timestamp);
        }

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

        let complianceMet = true;

        if (currentState && currentState.roi) {
            if (!this.checkROI(currentState.roi, pose)) complianceMet = false;
        }

        if (currentState && currentState.referencePose && complianceMet) {
            const similarity = PoseNormalizer.calculateSimilarity(pose.keypoints, currentState.referencePose);
            if (similarity < 0.75) complianceMet = false;
        }

        if (complianceMet && (currentState.roi || currentState.referencePose)) {
            if (!track.matchStartTime) track.matchStartTime = timestamp;
            const duration = (timestamp - track.matchStartTime) / 1000;
            const reqDuration = currentState.minDuration || 0.5;

            if (duration >= reqDuration) {
                const currentIndex = this.model.statesList.findIndex(s => s.id === currentStateId);
                const nextState = this.model.statesList[currentIndex + 1];

                if (nextState) {
                    this.transitionTo(track, nextState.id, timestamp, "Sequence Step Complete");
                    return;
                } else {
                    if (track.currentState !== 's_complete') {
                        this.addLog(track.id, timestamp, "Cycle Complete", `Cycle finished in ${((timestamp - track.stateEnterTime) / 1000).toFixed(1)}s`);
                    }
                }
            }
        } else {
            track.matchStartTime = null;
        }

        if (this.model.transitions && this.model.transitions.length > 0) {
            const possibleTransitions = this.model.transitions.filter(t => t.from === currentStateId);
            if (!track.transitionCandidates) track.transitionCandidates = {};

            for (const transition of possibleTransitions) {
                if (this.evaluateCondition(transition.condition, pose, objects, hands, track)) {
                    const holdTime = (transition.condition.holdTime || 0) * 1000;

                    if (holdTime > 0) {
                        if (!track.transitionCandidates[transition.id]) {
                            track.transitionCandidates[transition.id] = timestamp;
                        } else {
                            const elapsedTime = timestamp - track.transitionCandidates[transition.id];
                            if (elapsedTime >= holdTime) {
                                this.transitionTo(track, transition.to, timestamp, `Rule Triggered (Held ${(elapsedTime / 1000).toFixed(1)}s)`);
                                track.transitionCandidates = {};
                                break;
                            }
                        }
                    } else {
                        this.transitionTo(track, transition.to, timestamp, "Rule Triggered");
                        track.transitionCandidates = {};
                        break;
                    }
                } else {
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

        this.timelineEvents.push({
            trackId: track.id,
            state: this.getStateName(track.currentState),
            startTime: track.stateEnterTime,
            endTime: timestamp,
            duration: timestamp - track.stateEnterTime
        });

        this.addLog(track.id, timestamp, "Transition", `${fromState} -> ${toState} (${reason})`);
        track.currentState = newStateId;
        track.stateEnterTime = timestamp;
        track.matchStartTime = null;
    }

    checkROI(roi, pose) {
        const rightWrist = getKeypoint(pose.keypoints, 'right_wrist');
        const leftWrist = getKeypoint(pose.keypoints, 'left_wrist');

        const checkPoint = (pt) => {
            if (!pt || pt.score < 0.3) return false;
            return pt.x >= roi.x && pt.x <= (roi.x + roi.width) &&
                pt.y >= roi.y && pt.y <= (roi.y + roi.height);
        };
        return checkPoint(rightWrist) || checkPoint(leftWrist);
    }

    evaluateCondition(condition, pose, objects, hands, track) {
        if (!condition || !condition.rules || condition.rules.length === 0) return false;
        const operator = condition.operator || 'AND';
        const evaluateItem = (item) => {
            let result = (item.rules && item.rules.length > 0)
                ? this.evaluateCondition(item, pose, objects, hands, track)
                : this.checkRule(item, pose, objects, hands, track);
            return item.invert ? !result : result;
        };

        return operator === 'OR' ? condition.rules.some(evaluateItem) : condition.rules.every(evaluateItem);
    }

    checkRule(rule, pose, objects, hands, track) {
        const { type, params } = rule;
        switch (type) {
            case 'POSE_ANGLE': return this.checkPoseAngle(params, pose);
            case 'POSE_RELATION': return this.checkPoseRelation(params, pose);
            case 'POSE_VELOCITY': return this.checkPoseVelocity(params, track);
            case 'POSE_MATCHING': return this.checkPoseMatching(rule, pose);
            case 'HAND_GESTURE': return this.checkHandGesture(params, hands);
            case 'HAND_PROXIMITY': return this.checkHandProximity(params, hands, pose);
            default: return false;
        }
    }

    checkPoseVelocity(params, track) {
        const { joint, operator, value } = params;
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
                const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
                vels[curr.name] = dist / dt;
            }
        });
        return vels;
    }

    checkPoseRelation(params, pose) {
        const { jointA, jointB, component, operator, targetType, value } = params;
        let keypointsToUse = (this.model && this.model.coordinateSystem !== 'screen')
            ? PoseNormalizer.normalize(pose.keypoints)
            : pose.keypoints;

        const pA = getKeypoint(keypointsToUse, jointA);
        if (!pA) return false;

        let valA = pA[component || 'y'];
        let valB = value;

        if (targetType === 'POINT' && jointB) {
            const pB = getKeypoint(keypointsToUse, jointB);
            if (!pB) return false;
            valB = pB[component || 'y'];
        }

        switch (operator) {
            case '>': return valA > valB;
            case '<': return valA < valB;
            case '=': return Math.abs(valA - valB) < 0.05;
            default: return false;
        }
    }

    checkPoseMatching(rule, currentPose) {
        const { targetStateId, threshold = 0.8 } = rule.params;
        const targetState = this.model.statesList.find(s => s.id === targetStateId);
        if (!targetState || !targetState.referencePose) return false;
        return PoseNormalizer.calculateSimilarity(currentPose.keypoints, targetState.referencePose) >= threshold;
    }

    checkPoseAngle(params, pose) {
        const { jointA, jointB, jointC, operator, value } = params;
        const pA = getKeypoint(pose.keypoints, jointA);
        const pB = getKeypoint(pose.keypoints, jointB);
        const pC = getKeypoint(pose.keypoints, jointC);
        if (!pA || !pB || !pC) return false;
        const angle = this.angleCalculator.calculateAngle(pA, pB, pC);
        return operator === '>' ? angle > value : angle < value;
    }

    checkHandGesture(params, hands) {
        const { gesture } = params;
        if (!hands || hands.length === 0) return false;
        return hands.some(hand => {
            const isIndexUp = hand[8].y < hand[5].y;
            const detected = isIndexUp ? 'pointing' : 'fist';
            return detected === gesture;
        });
    }

    checkHandProximity(params, hands, pose) {
        const { landmark, bodyPart, distance, operator = '<' } = params;
        if (!hands || hands.length === 0 || !pose) return false;
        const bodyKeypoint = getKeypoint(pose.keypoints, bodyPart);
        if (!bodyKeypoint) return false;

        return hands.some(hand => {
            const handLandmark = hand[landmark] || hand[0];
            const dist = Math.hypot(handLandmark.x - bodyKeypoint.x, handLandmark.y - bodyKeypoint.y);
            return operator === '<' ? dist < distance : dist > distance;
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
            trackId, type, message
        });
        if (this.logs.length > 50) this.logs.pop();
    }
}

// Export instance for runtime usage
export const inferenceEngine = new InferenceEngine();

// Export class if needed
export default InferenceEngine;
