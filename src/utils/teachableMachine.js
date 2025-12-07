/**
 * Utility to handle Teachable Machine Pose model loading and prediction.
 * Uses dynamic script injection to load the required libraries from CDN.
 */

const TM_POSE_SCRIPT = "https://cdn.jsdelivr.net/npm/@teachablemachine/pose@0.8/dist/teachablemachine-pose.min.js";
const TF_SCRIPT = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.3.1/dist/tf.min.js";

let isLibraryLoaded = false;
let isLoadingLibrary = false;

/**
 * Loads the Teachable Machine scripts dynamically
 */
export const loadScripts = () => {
    return new Promise((resolve, reject) => {
        if (isLibraryLoaded) {
            resolve();
            return;
        }

        if (isLoadingLibrary) {
            // Simple polling if already loading
            const checkParams = setInterval(() => {
                if (isLibraryLoaded) {
                    clearInterval(checkParams);
                    resolve();
                }
            }, 100);
            return;
        }

        isLoadingLibrary = true;

        // Load TensorFlow.js first
        const tfScript = document.createElement('script');
        tfScript.src = TF_SCRIPT;
        tfScript.onload = () => {
            console.log('TensorFlow.js loaded for Teachable Machine');

            // Then load TM Pose
            const tmScript = document.createElement('script');
            tmScript.src = TM_POSE_SCRIPT;
            tmScript.onload = () => {
                console.log('Teachable Machine Pose loaded');
                isLibraryLoaded = true;
                isLoadingLibrary = false;
                resolve();
            };
            tmScript.onerror = (e) => {
                isLoadingLibrary = false;
                reject(new Error('Failed to load Teachable Machine Pose library'));
            };
            document.head.appendChild(tmScript);
        };
        tfScript.onerror = (e) => {
            isLoadingLibrary = false;
            reject(new Error('Failed to load TensorFlow.js library for Teachable Machine'));
        };
        document.head.appendChild(tfScript);
    });
};

/**
 * Load a model from a URL (Online)
 * @param {string} url - The URL of the model (should end with /)
 */
export const loadModelFromURL = async (url) => {
    await loadScripts();
    if (!window.tmPose) throw new Error('Teachable Machine library not loaded');

    // Ensure URL ends with slash
    if (!url.endsWith('/')) url = url + '/';

    const modelURL = url + "model.json";
    const metadataURL = url + "metadata.json";

    try {
        const model = await window.tmPose.load(modelURL, metadataURL);
        return model;
    } catch (error) {
        console.error("Error loading TM model from URL:", error);
        throw new Error("Failed to load model from URL. Please check if the URL is correct (e.g., https://teachablemachine.withgoogle.com/models/.../)");
    }
};

/**
 * Load a model from uploaded files (Offline)
 * @param {File} modelFile - model.json
 * @param {File} weightsFile - weights.bin
 * @param {File} metadataFile - metadata.json
 */
export const loadModelFromFiles = async (modelFile, weightsFile, metadataFile) => {
    await loadScripts();
    if (!window.tmPose) throw new Error('Teachable Machine library not loaded');

    try {
        const model = await window.tmPose.loadFromFiles(modelFile, weightsFile, metadataFile);
        return model;
    } catch (error) {
        console.error("Error loading TM model from files:", error);
        throw new Error("Failed to load model from files. Ensure you have model.json, weights.bin, and metadata.json");
    }
};

/**
 * Predict pose using the loaded model
 * @param {Object} model - The loaded TM model
 * @param {HTMLVideoElement | HTMLCanvasElement} input - The image source
 */
export const predict = async (model, input) => {
    if (!model) return null;

    // estimatePose outputs: { pose, posenetOutput }
    const { pose, posenetOutput } = await model.estimatePose(input);

    // predict outputs: [{ className, probability }, ...]
    const prediction = await model.predict(posenetOutput);

    // Find class with highest probability
    let highestProb = 0;
    let bestClass = "";

    prediction.forEach(p => {
        if (p.probability > highestProb) {
            highestProb = p.probability;
            bestClass = p.className;
        }
    });

    return {
        pose,
        prediction,
        bestClass,
        accuracy: highestProb
    };
};
