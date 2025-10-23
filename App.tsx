
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { SceneGrid } from './components/SceneGrid';
import { Scene, AspectRatio } from './types';
import { generateSceneDescriptions, generateImageForScene, generateVideoForScene } from './services/geminiService';
import { Logo } from './components/icons/Logo';
import { DownloadIcon } from './components/icons/DownloadIcon';

const App: React.FC = () => {
    const [referenceImage, setReferenceImage] = useState<File | null>(null);
    const [story, setStory] = useState<string>('');
    const [numScenes, setNumScenes] = useState<number>(10);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!referenceImage || !story) {
            setError('Please provide a reference image and a story description.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setScenes([]);

        try {
            const sceneDescriptions = await generateSceneDescriptions(referenceImage, story, numScenes);
            const initialScenes = sceneDescriptions.map((desc, index) => ({
                ...desc,
                id: index + 1,
                isGeneratingImage: true,
                isGeneratingVideo: false,
            }));
            setScenes(initialScenes);

            const imageGenerationPromises = initialScenes.map(scene => 
                generateImageForScene(scene.imagePrompt, aspectRatio, referenceImage)
            );

            const imageResults = await Promise.allSettled(imageGenerationPromises);

            setScenes(prevScenes => prevScenes.map((scene, index) => {
                const result = imageResults[index];
                if (result.status === 'fulfilled') {
                    return { ...scene, imageUrl: result.value, isGeneratingImage: false };
                } else {
                    console.error(`Failed to generate image for scene ${scene.id}:`, result.reason);
                    return { ...scene, isGeneratingImage: false, error: 'Image generation failed' };
                }
            }));

        } catch (e) {
            console.error(e);
            setError('Failed to generate scene descriptions. Please check your API key and try again.');
            setScenes([]);
        } finally {
            setIsLoading(false);
        }
    }, [referenceImage, story, numScenes, aspectRatio]);

    const handleGenerateVideo = useCallback(async (sceneId: number) => {
        const sceneIndex = scenes.findIndex(s => s.id === sceneId);
        if (sceneIndex === -1 || !scenes[sceneIndex].imageUrl) return;

        setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: true, videoGenerationProgress: 'Initializing...' } : s));

        try {
            const currentScene = scenes[sceneIndex];
            const videoUrl = await generateVideoForScene(
                currentScene.imagePrompt,
                currentScene.imageUrl!,
                (progress) => {
                    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoGenerationProgress: progress } : s));
                }
            );
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, videoUrl, isGeneratingVideo: false, videoGenerationProgress: 'Done' } : s));
        } catch (e) {
            console.error(`Failed to generate video for scene ${sceneId}:`, e);
            setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isGeneratingVideo: false, error: 'Video generation failed' } : s));
        }
    }, [scenes]);

    const handleDownloadAll = useCallback(async () => {
        const scenesWithImages = scenes.filter(scene => scene.imageUrl);
        if (scenesWithImages.length === 0) return;

        for (const scene of scenesWithImages) {
            const link = document.createElement('a');
            link.href = scene.imageUrl!;
            link.download = `scene_${scene.id}_image.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            // Add a small delay to prevent browser from blocking rapid downloads
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }, [scenes]);

    return (
        <div className="min-h-screen bg-black">
            <header className="py-4 px-8 border-b border-gray-800 flex items-center justify-center">
                 <div className="flex items-center gap-2">
                    <Logo />
                    <h1 className="text-2xl font-bold tracking-wider text-gray-200">NEXABOT</h1>
                </div>
            </header>
            <main className="flex flex-col md:flex-row gap-8 p-4 md:p-8">
                <Sidebar
                    setReferenceImage={setReferenceImage}
                    story={story}
                    setStory={setStory}
                    numScenes={numScenes}
                    setNumScenes={setNumScenes}
                    aspectRatio={aspectRatio}
                    setAspectRatio={setAspectRatio}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                />
                <div className="flex-1">
                    {error && <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg mb-4">{error}</div>}
                    
                    {scenes.some(s => s.imageUrl && !s.isGeneratingImage) && (
                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={handleDownloadAll}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <DownloadIcon />
                                <span>Download All Images</span>
                            </button>
                        </div>
                    )}

                    <SceneGrid scenes={scenes} onGenerateVideo={handleGenerateVideo} />
                </div>
            </main>
        </div>
    );
};

export default App;
