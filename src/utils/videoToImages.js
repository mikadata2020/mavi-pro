import JSZip from 'jszip';

/**
 * Extracts frames from a video blob at a specific interval and packages them into a ZIP file.
 * @param {Blob} videoBlob - The video file blob.
 * @param {number} fps - Number of frames to extract per second of video.
 * @param {string} fileNamePrefix - Prefix for the image filenames.
 * @returns {Promise<Blob>} - A promise that resolves to a ZIP blob.
 */
export const extractFramesToZip = async (videoBlob, fps = 5, fileNamePrefix = 'frame') => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const zip = new JSZip();
        const url = URL.createObjectURL(videoBlob);

        video.src = url;
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = async () => {
            const duration = video.duration;
            const interval = 1 / fps;
            let currentTime = 0;
            let frameCount = 0;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            try {
                while (currentTime < duration) {
                    video.currentTime = currentTime;

                    // Wait for the video to seek
                    await new Promise((res) => {
                        const onSeeked = () => {
                            video.removeEventListener('seeked', onSeeked);
                            res();
                        };
                        video.addEventListener('seeked', onSeeked);
                    });

                    // Draw frame to canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // Convert to JPG
                    const imageData = canvas.toDataURL('image/jpeg', 0.9);
                    const base64Data = imageData.split(',')[1];

                    // Add to ZIP
                    const fileName = `${fileNamePrefix}_${String(frameCount).padStart(4, '0')}.jpg`;
                    zip.file(fileName, base64Data, { base64: true });

                    currentTime += interval;
                    frameCount++;
                }

                const content = await zip.generateAsync({ type: 'blob' });
                URL.revokeObjectURL(url);
                resolve(content);
            } catch (err) {
                URL.revokeObjectURL(url);
                reject(err);
            }
        };

        video.onerror = (err) => {
            URL.revokeObjectURL(url);
            reject(err);
        };
    });
};
