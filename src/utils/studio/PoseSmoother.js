/**
 * PoseSmoother.js
 * Implements temporal smoothing for Pose Detection keypoints to reduce jitter.
 * Uses Exponential Moving Average (EMA).
 */

class PoseSmoother {
    constructor(alpha = 0.5) {
        this.alpha = alpha; // Smoothing factor (0 < alpha <= 1). Lower = smoother but more lag.
        this.prevKeypoints = null; // Store previous frame's smoothed keypoints
    }

    /**
     * Smooths the incoming keypoints using EMA.
     * @param {Array} keypoints - Array of keypoint objects {x, y, z, score, name}
     * @returns {Array} - Smoothed keypoints
     */
    smooth(keypoints) {
        if (!keypoints || keypoints.length === 0) return keypoints;

        // If first frame, just store it and return
        if (!this.prevKeypoints) {
            this.prevKeypoints = keypoints.map(k => ({ ...k })); // Deep copy
            return keypoints;
        }

        const smoothedKeypoints = keypoints.map((currentKp, index) => {
            const prevKp = this.prevKeypoints[index];

            // If keypoint tracking was lost or switched, or names don't match, reset for this point
            if (!prevKp || prevKp.name !== currentKp.name) {
                return { ...currentKp };
            }

            // Apply EMA: Smoothed = alpha * Current + (1 - alpha) * Previous
            // We smooth x, y, and z. Score is usually left as is or smoothed lightly.
            // Here we smooth x, y, z.
            const smoothX = this.alpha * currentKp.x + (1 - this.alpha) * prevKp.x;
            const smoothY = this.alpha * currentKp.y + (1 - this.alpha) * prevKp.y;

            // Handle z if it exists (3D)
            let smoothZ = currentKp.z;
            if (currentKp.z !== undefined && prevKp.z !== undefined) {
                smoothZ = this.alpha * currentKp.z + (1 - this.alpha) * prevKp.z;
            }

            return {
                ...currentKp,
                x: smoothX,
                y: smoothY,
                z: smoothZ,
                score: currentKp.score // Keep original confidence score
            };
        });

        // Update history
        this.prevKeypoints = smoothedKeypoints;
        return smoothedKeypoints;
    }

    /**
     * Resets the smoother history (e.g., when changing video source or model)
     */
    reset() {
        this.prevKeypoints = null;
    }

    /**
     * Adjust smoothing factor dynamically
     * @param {number} newAlpha 
     */
    setAlpha(newAlpha) {
        this.alpha = Math.max(0.1, Math.min(1.0, newAlpha));
    }
}

export default PoseSmoother;
