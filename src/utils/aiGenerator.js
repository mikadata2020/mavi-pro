
/**
 * Helper to get the API key from storage if not provided
 */
const getStoredApiKey = (providedKey) => {
    if (providedKey) return providedKey;
    return localStorage.getItem('gemini_api_key') || '';
};

/**
 * Generates content for a work instruction manual step using Google Gemini API.
 * @param {string} taskName - The name of the task/step.
 * @param {string} apiKey - The Google Gemini API Key.
 * @param {string} model - The specific model to use (optional).
 * @returns {Promise<{description: string, keyPoints: string, safety: string}>}
 */
export const generateManualContent = async (taskName, apiKey, model = null) => {
    const keyToUse = getStoredApiKey(apiKey);
    if (!keyToUse) {
        throw new Error("API Key is missing. Please configure it in AI Settings.");
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

    return await callAIProvider(prompt, apiKey, model, true);
};

/**
 * Improves existing content for grammar, clarity, and tone.
 * @param {object} content - { description, keyPoints, safety }
 * @param {string} apiKey - The Google Gemini API Key.
 * @param {string} model - The specific model to use (optional).
 * @returns {Promise<{description: string, keyPoints: string, safety: string}>}
 */
export const improveManualContent = async (content, apiKey, model = null) => {
    const keyToUse = getStoredApiKey(apiKey);
    if (!keyToUse) {
        throw new Error("API Key is missing. Please configure it in AI Settings.");
    }

    const prompt = `
        You are a grammar and spelling editor.
        
        CRITICAL RULES:
        1. **PRESERVE THE ORIGINAL LANGUAGE** - If input is in Indonesian, output MUST be in Indonesian. If English, output in English. NEVER translate.
        2. **ONLY FIX GRAMMAR AND SPELLING** - Do NOT add new information, details, or explanations
        3. **KEEP THE SAME LENGTH** - Do not make sentences longer or shorter
        4. **KEEP THE SAME MEANING** - Only fix errors, do not change the content
        5. Fix: capitalization, punctuation, spelling mistakes, grammar errors
        6. Do NOT add: extra words, technical terms, or additional details
        
        Input Data:
        Description: "${content.description || ''}"
        Key Points: "${content.keyPoints || ''}"
        Safety: "${content.safety || ''}"
 
        Output the corrected text (SAME LANGUAGE, SAME LENGTH, SAME MEANING) in JSON format:
        {
            "description": "Grammar-corrected description",
            "keyPoints": "Grammar-corrected key points",
            "safety": "Grammar-corrected safety"
        }
        
        If a field is empty, return it as empty string "".
    `;

    console.log('AI Improve Request:', { content, model });
    const result = await callAIProvider(prompt, keyToUse, model);
    console.log('AI Improve Response:', result);
    return result;
};

/**
 * Generates a comprehensive Kaizen Report based on project data.
 * @param {object} context - Project data (measurements, metrics, etc.)
 * @param {string} apiKey - The Google Gemini API Key.
 * @param {string} model - The specific model to use (optional).
 * @param {string} language - The target language for the report (default: 'English').
 * @returns {Promise<string>} Markdown formatted report
 */
export const generateKaizenReport = async (context, apiKey, model = null, language = 'English') => {
    const keyToUse = getStoredApiKey(apiKey);
    if (!keyToUse) {
        throw new Error("API Key is missing. Please configure it in AI Settings.");
    }

    // Format context data for the prompt
    const metrics = context.metrics || {};
    const elements = context.elements || [];

    const elementsList = elements.map((el, i) =>
        `- ${el.elementName} (${el.therblig}): ${el.duration.toFixed(2)}s [${el.valueAdded ? 'VA' : 'NVA'}]`
    ).join('\n');

    const prompt = `
        You are a Senior Industrial Engineer and Lean Six Sigma Black Belt.
        Generate a "Kaizen Report" (Continuous Improvement Report) for the following process data.

        **Project Context:**
        - Project Name: ${context.projectName || 'N/A'}
        - Total Cycle Time: ${metrics.totalCycleTime ? metrics.totalCycleTime.toFixed(2) : 'N/A'} s
        - Value Added Ratio: ${metrics.valueAddedRatio ? (metrics.valueAddedRatio * 100).toFixed(1) : 'N/A'}%
        - Efficiency Score: ${metrics.efficiencyScore ? (metrics.efficiencyScore * 100).toFixed(1) : 'N/A'}%
        - Productivity Index: ${metrics.productivityIndex ? metrics.productivityIndex.toFixed(2) : 'N/A'}

        **Process Elements:**
        ${elementsList}

        **Instructions:**
        Create a professional, actionable report in Markdown format. 
        The report MUST be written in **${language}**.
        
        Structure the report exactly as follows (translate headers to ${language}):

        # 🚀 Kaizen Report: [Project Name]

        ## 📊 Executive Summary
        [Brief summary of current performance and main issues]

        ## 🗑️ Waste Identification (Muda)
        [Identify specific non-value-added activities from the element list. Group them by 7 Wastes if applicable.]

        ## 💡 Improvement Recommendations
        [Specific, actionable steps to reduce cycle time and improve efficiency. Suggest ECRS (Eliminate, Combine, Rearrange, Simplify) actions.]

        ## 📈 Projected Benefits
        [Estimate potential time savings or efficiency gains if recommendations are implemented]

        ---
        *Generated by Motion Study AI*
    `;

    console.log('Generating Kaizen Report...');
    return await callAIProvider(prompt, keyToUse, model, false); // Expect text/markdown, not JSON
};

/**
 * Optimizes the layout of workstations based on flow data (Spaghetti Chart).
 * @param {Array} nodes - Current nodes {name, x, y}
 * @param {Array} flowData - Connections {from, to, count}
 * @param {string} apiKey
 * @param {string} model
 * @returns {Promise<Array>} Optimized nodes with new x,y coordinates
 */
export const generateLayoutOptimization = async (nodes, flowData, apiKey, model = null) => {
    const keyToUse = getStoredApiKey(apiKey);
    if (!keyToUse) throw new Error("API Key is missing. Please configure it in AI Settings.");

    const nodesList = nodes.map(n => n.name).join(', ');
    const flowList = flowData.map(f => `${f.from} -> ${f.to} (${f.count} times)`).join('\n');

    const prompt = `
        You are a Facility Layout Optimization Expert.
        
        **Objective:**
        Optimize the 2D layout of workstations to MINIMIZE total travel distance based on the flow frequency.
        
        **Constraints:**
        1. Canvas Size: Width 1000px, Height 600px.
        2. Padding: Keep nodes at least 50px from edges.
        3. Spacing: Keep nodes at least 100px apart to avoid overlap.
        4. Grouping: High-frequency connections MUST be placed closer together.
        5. Flow: Try to create a logical flow (e.g., U-shape, L-shape, or straight line) if applicable.
        
        **Input Data:**
        Nodes: ${nodesList}
        
        Flow Frequency (From -> To):
        ${flowList}
        
        **Output:**
        Return ONLY a valid JSON ARRAY of objects. Do not include any markdown formatting, code blocks, or explanations.
        Example format:
        [
            { "name": "Station A", "x": 150, "y": 300, "reason": "Central hub" },
            ...
        ]
    `;

    console.log('Generating Layout Optimization...');
    return await callAIProvider(prompt, keyToUse, model, true); // Expect JSON
};

/**
 * Validates the API Key and returns the list of available models.
 * @param {string} apiKey 
 * @returns {Promise<string[]>} List of available model names
 */
export const validateApiKey = async (apiKey) => {
    // For validation, we might want to explicitly require the key passed in, 
    // but consistency says we could fallback. 
    // However, validation is usually for a specific NEW key. 
    // Let's keep existing logic but allow fallback if called without arg (though unlikely for validation).
    // Trim whitespace from key to avoid simple copy-paste errors
    const keyToUse = (apiKey || localStorage.getItem('gemini_api_key') || '').trim();
    if (!keyToUse) throw new Error("API Key is missing");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToUse}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Handle cases where json parse fails
            throw new Error(errorData.error?.message || `API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.models) {
            return [];
        }

        // Filter for models that support generateContent
        return data.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace('models/', ''));

    } catch (error) {
        console.error("API Validation Error:", error);
        if (error.message === 'Failed to fetch') {
            throw new Error("Network Error: Could not connect to Google Gemini API. Please check your internet connection and disable any Ad Blockers or VPNs that might differ traffic.");
        }
        throw error;
    }
};

import { helpContent } from './helpContent';

// Helper to strip HTML/JSX tags for AI context
const getPlainHelpText = () => {
    let text = "APPLICATION USER GUIDE:\n\n";
    Object.entries(helpContent).forEach(([key, value]) => {
        // Simple regex to strip tags, could be improved but sufficient for context
        const cleanContent = JSON.stringify(value.content)
            .replace(/<[^>]*>/g, ' ') // Remove HTML tags
            .replace(/\\n/g, ' ')
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim();
        text += `FEATURE: ${value.title}\n${cleanContent}\n\n`;
    });
    return text;
};

/**
 * Chat with AI for Industrial Engineering analysis
 * @param {string} userMessage - User's question or message
 * @param {object} context - Measurement data context (elements, project info, etc.)
 * @param {array} chatHistory - Previous chat messages for context
 * @param {string} apiKey - The Google Gemini API Key
 * @param {string} model - The specific model to use (optional)
 * @returns {Promise<string>} AI response
 */
export const chatWithAI = async (userMessage, context = {}, chatHistory = [], apiKey, model = null) => {
    const keyToUse = getStoredApiKey(apiKey);
    if (!keyToUse) {
        throw new Error("API Key is missing. Please configure it in AI Settings.");
    }

    // Build context summary from measurement data
    let contextSummary = "";
    if (context.elements && context.elements.length > 0) {
        const totalTime = context.elements.reduce((sum, el) => sum + (el.duration || 0), 0);
        const elementList = context.elements.map((el, i) =>
            `${i + 1}. ${el.elementName || 'Unnamed'} (${el.therblig || 'N/A'}) - ${(el.duration || 0).toFixed(2)}s`
        ).join('\n');

        contextSummary = `
Current Measurement Data:
- Project: ${context.projectName || 'Unnamed Project'}
- Total Elements: ${context.elements.length}
- Total Cycle Time: ${totalTime.toFixed(2)} seconds
- Elements:
${elementList}
`;
    }

    // Get Application Knowledge Base
    const appKnowledge = getPlainHelpText();

    // Get provider settings
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    const baseUrl = localStorage.getItem('ai_base_url') || '';

    // Build chat history context
    let historyContext = "";
    if (chatHistory.length > 0) {
        historyContext = "\n\nPrevious conversation:\n" +
            chatHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');
    }

    const prompt = `
        You are "Mavi", an expert Industrial Engineer and the official assistant for the "Motion Study Application".
        
        **YOUR KNOWLEDGE BASE (How this app works):**
        ${appKnowledge}

        **CURRENT ANALYSIS CONTEXT:**
        ${contextSummary}
        
        **HISTORY:**
        ${historyContext}
        
        **USER QUESTION:** 
        ${userMessage}
        
        **INSTRUCTIONS:**
        1. Always answer based on the "Application User Guide" if the user asks about features.
        2. If asked about Industrial Engineering (Time Study, Line Balancing, etc.), use your general expert knowledge.
        3. Be helpful, professional, and concise.
        4. Provide specific recommendations based on the measurement data if available.
        5. Respond in the SAME LANGUAGE as the user (Indonesian or English).
        
        Respond directly without JSON formatting.
    `;

    console.log('AI Chat Request:', { userMessage, context: contextSummary });

    try {
        if (provider === 'gemini') {
            const modelToUse = model || localStorage.getItem('gemini_model') || 'gemini-1.5-flash-002';
            const aiResponse = await callGemini(prompt, keyToUse, modelToUse, false);
            console.log('AI Chat Response:', aiResponse);
            return aiResponse;
        } else {
            // OpenAI Compatible Chat
            return await callOpenAICompatible(prompt, keyToUse, model, baseUrl);
        }


    } catch (error) {
        console.error('AI Chat Error:', error);
        throw error;
    }
};

/**
 * Main entry point for AI calls. Routes to specific provider.
 */
const callAIProvider = async (prompt, apiKey, specificModel = null, expectJson = true) => {
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    const baseUrl = localStorage.getItem('ai_base_url') || '';
    const keyToUse = getStoredApiKey(apiKey);

    // Default models if not specified
    let model = specificModel;
    if (!model) {
        model = localStorage.getItem('gemini_model') || (provider === 'gemini' ? 'gemini-1.5-flash-002' : 'gpt-3.5-turbo');
    }

    if (provider === 'gemini') {
        return await callGemini(prompt, keyToUse, model, expectJson);
    } else {
        return await callOpenAICompatible(prompt, keyToUse, model, baseUrl, expectJson);
    }
};

/**
 * Generic handler for OpenAI-compatible APIs (OpenAI, Grok, Qwen, DeepSeek, LocalAI)
 */
const callOpenAICompatible = async (prompt, apiKey, model, baseUrl, expectJson = true) => {
    const url = baseUrl ? `${baseUrl}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
    const keyToUse = getStoredApiKey(apiKey);

    console.log(`Calling OpenAI Compatible API: ${url} with model ${model}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${keyToUse}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: "You are a helpful assistant. Respond in JSON format if requested." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
            throw new Error("No response generated");
        }

        let text = data.choices[0].message.content;

        // Clean up markdown code blocks if present (same as Gemini handler)
        text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        // Try parsing as JSON if it looks like JSON
        // Match either {...} or [...]
        const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (expectJson) {
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[0]);
                } catch (e) {
                    // If parse fails but we expected JSON, we might want to throw or just return text.
                    return text;
                }
            }
        }

        return text;

    } catch (error) {
        console.error("OpenAI Compatible API Error:", error);
        throw error;
    }
};

const callGemini = async (prompt, apiKey, specificModel = null, expectJson = true) => {
    // Standardize model names to ensure we aren't sending bad strings
    const cleanModel = (m) => m ? m.replace('models/', '') : null;

    // Priority list:
    // 1. specificModel (if provided)
    // 2. gemini-1.5-flash (Fast, assume stable)
    // 3. gemini-1.5-pro (Higher quality, fallback if flash fails?) - No, usually flash is the fallback for pro.
    // 4. gemini-pro (Old reliable)

    // If specificModel is provided, we try it first.
    // If it fails, we fall back to 'gemini-1.5-flash' (unless specificModel was already flash).

    let modelsToTry = [];
    if (specificModel) {
        modelsToTry.push(cleanModel(specificModel));
    }

    // Always add efficient fallbacks if they aren't already the first choice
    // Always add efficient fallbacks if they aren't already the first choice
    if (!modelsToTry.includes('gemini-1.5-flash')) modelsToTry.push('gemini-1.5-flash');
    if (!modelsToTry.includes('gemini-2.0-flash-exp')) modelsToTry.push('gemini-2.0-flash-exp'); // Try newer experimental if flash fails
    if (!modelsToTry.includes('gemini-1.5-pro')) modelsToTry.push('gemini-1.5-pro'); // Try pro last


    let lastError = null;
    const keyToUse = getStoredApiKey(apiKey);

    for (const model of modelsToTry) {
        try {
            console.log(`Attempting AI generation with model: ${model}`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse}`, {
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
                const errorData = await response.json().catch(() => ({}));
                console.warn(`Model ${model} failed with status ${response.status}:`, errorData);

                // If 404 (Not Found) or 400 (Bad Request), it's likely a model name issue. Try next.
                // If 403 (Permission) or 429 (Quota), it might be key/quota related, but we can still try a cheaper model (like flash) just in case.
                lastError = new Error(errorData.error?.message || `Model ${model} failed`);
                continue;
            }

            const data = await response.json();
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No content generated");
            }
            let text = data.candidates[0].content.parts[0].text;

            // Clean up the text to remove markdown code blocks if present
            text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

            if (!expectJson) {
                return text;
            }

            // Extract JSON from the text
            const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
            if (jsonMatch) {
                let jsonText = jsonMatch[0];
                // Sanitize control characters
                jsonText = jsonText
                    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, '')
                    .replace(/\n/g, ' ')
                    .replace(/\r/g, '')
                    .replace(/\t/g, ' ');

                try {
                    return JSON.parse(jsonText);
                } catch (e) {
                    console.error('JSON Parse Error:', e);
                    throw new Error("Invalid JSON format from AI: " + e.message);
                }
            } else {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    // console.error('Failed to parse AI response:', text); // Optional logging
                    throw new Error("Invalid response format from AI - no valid JSON found");
                }
            }

        } catch (error) {
            console.error(`AI Generation Error (${model}):`, error);
            lastError = error;
            // Continue to next model in list
        }
    }

    throw lastError || new Error("AI generation failed. Please check your API Key and network connection.");
};
