// Fix: Import Modality for image editing and remove non-existent VideosOperationResponse.
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { SceneDescription, AspectRatio } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

const base64ToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: { data: base64.split(',')[1], mimeType: mimeType },
    };
};

export const generateSceneDescriptions = async (
    referenceImage: File,
    story: string,
    numScenes: number
): Promise<SceneDescription[]> => {
    const imagePart = await fileToGenerativePart(referenceImage);

    // Step 1: Describe the character in the reference image
    const descriptionResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          imagePart,
          { text: "Describe the person in this image in extreme detail, focusing on visual characteristics that an AI image generator can use to recreate them. Include their ethnicity, face shape, eyes, hair color and style, skin tone, clothing, and any distinctive features. Present this as a comma-separated list of highly specific descriptors for an image prompt." }
        ]
      }
    });

    const characterDescription = descriptionResponse.text;

    // Step 2: Generate scene breakdowns based on the story and character description
    const model = 'gemini-2.5-flash';
    const prompt = `
        You are an expert film director and screenwriter. Your task is to break down a user-provided story into a series of distinct, cinematic scenes, ensuring visual consistency with a character from a reference image.

        Story: "${story}"
        Character Description: "${characterDescription}"

        Generate a JSON array of exactly ${numScenes} scene objects. Each object must follow the provided schema.
        - 'shotType': A cinematic shot type (e.g., 'Medium Close-Up', 'Extreme Wide Shot', 'Point of View').
        - 'description': A one-paragraph description of the action and emotion in the scene.
        - 'location': A brief description of the setting.
        - 'mood': Two or three keywords describing the emotional tone.
        - 'imagePrompt': A vivid, detailed prompt for an AI image editing model. The goal is to place the character from the reference image into this new scene. The prompt MUST start with the detailed character description ("${characterDescription}") to reinforce their appearance, followed by the new action, setting, and mood. For example: "A photo of ${characterDescription}, now sitting at a cafe, looking thoughtful."
    `;

    const result = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        shotType: { type: Type.STRING },
                        description: { type: Type.STRING },
                        location: { type: Type.STRING },
                        mood: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING },
                    },
                    required: ['shotType', 'description', 'location', 'mood', 'imagePrompt'],
                },
            },
        },
    });

    const jsonText = result.text.trim();
    return JSON.parse(jsonText);
};


export const generateImageForScene = async (prompt: string, aspectRatio: AspectRatio, referenceImage: File): Promise<string> => {
    // Fix: Added responseModalities config which is required for gemini-2.5-flash-image model.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                await fileToGenerativePart(referenceImage),
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image generated from gemini-2.5-flash-image model");
};

export const generateVideoForScene = async (
    prompt: string,
    imageBase64: string,
    onProgress: (status: string) => void
): Promise<string> => {
    onProgress("Starting video generation...");
    const mimeType = imageBase64.substring(imageBase64.indexOf(":") + 1, imageBase64.indexOf(";"));
    const imagePart = base64ToGenerativePart(imageBase64, mimeType);

    // Fix: Removed incorrect VideosOperationResponse type annotation.
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
        },
        config: { numberOfVideos: 1 }
    });
    
    onProgress("Processing... This can take several minutes.");

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        onProgress("Checking status...");
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if(operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
    }

    onProgress("Fetching video data...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was found.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
};