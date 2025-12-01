
/**
 * Generates content for a work instruction manual step using Google Gemini API.
 * @param {string} taskName - The name of the task/step.
 * @param {string} apiKey - The Google Gemini API Key.
 * @returns {Promise<{description: string, keyPoints: string, safety: string}>}
 */
export const generateManualContent = async (taskName, apiKey) => {
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }

    const prompt = `
        You are an industrial engineering expert creating a Work Instruction Manual.
        For the task "${taskName}", provide the following in JSON format ONLY:
        1. "description": A clear, concise, professional description of the action (max 2 sentences).
        2. "keyPoints": 2-3 critical quality or efficiency points (comma separated).
        3. "safety": 1-2 important safety or ergonomic warnings (comma separated).
        
        Example output format:
        {
            "description": "Pick up the part with the left hand and orient it for assembly.",
            "keyPoints": "Ensure firm grip, Check for burrs",
            "safety": "Wear gloves, Avoid sharp edges"
        }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to generate content');
        }

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;

        // Extract JSON from the response (in case of markdown formatting)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Invalid response format from AI");
        }

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};
