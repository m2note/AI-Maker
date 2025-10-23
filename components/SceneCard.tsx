import React, { useState } from 'react';
import { Scene } from '../types';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { VideoIcon } from './icons/VideoIcon';
import { CopyIcon } from './icons/CopyIcon';

interface SceneCardProps {
    scene: Scene;
    onGenerateVideo: (sceneId: number) => void;
}

const SkeletonLoader: React.FC = () => (
    <div className="animate-pulse bg-gray-700/50 w-full h-48 rounded-t-lg"></div>
);

export const SceneCard: React.FC<SceneCardProps> = ({ scene, onGenerateVideo }) => {
    const [promptCopied, setPromptCopied] = useState(false);

    const handleDownloadImage = () => {
        if (!scene.imageUrl) return;
        const link = document.createElement('a');
        link.href = scene.imageUrl;
        link.download = `scene_${scene.id}_image.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCopyPrompt = () => {
        if (!scene.imagePrompt) return;
        navigator.clipboard.writeText(scene.imagePrompt)
            .then(() => {
                setPromptCopied(true);
                setTimeout(() => setPromptCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex flex-col transform transition-all duration-300 hover:shadow-2xl hover:shadow-green-900/30 hover:-translate-y-1">
            <div className="relative">
                {scene.isGeneratingImage && <SkeletonLoader />}
                {scene.imageUrl && !scene.isGeneratingImage && (
                    <img src={scene.imageUrl} alt={`Scene ${scene.id}`} className="w-full h-48 object-cover" />
                )}
                 {scene.error && !scene.isGeneratingImage && (
                    <div className="w-full h-48 bg-red-900/20 flex items-center justify-center text-red-400 text-center p-4">
                        <p>Error: {scene.error}</p>
                    </div>
                 )}
                 <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
                    Scene {scene.id}
                 </div>
                 <div className="absolute top-2 right-2 bg-green-900/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-green-300 flex items-center gap-1">
                    <CheckIcon />
                    <span>Ready</span>
                 </div>
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-green-400">{scene.shotType}</h3>
                <p className="text-sm text-gray-300 mt-2 flex-grow">{scene.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                    <div>
                        <p className="font-semibold text-gray-400">Location</p>
                        <p className="text-gray-200">{scene.location}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-gray-400">Mood</p>
                        <p className="text-gray-200">{scene.mood}</p>
                    </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                    <button
                        onClick={handleDownloadImage}
                        disabled={!scene.imageUrl}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                        <DownloadIcon />
                        Download Image
                    </button>
                    {scene.videoUrl ? (
                         <a
                            href={scene.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors text-sm"
                         >
                            <VideoIcon />
                            View Video
                         </a>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onGenerateVideo(scene.id)}
                                disabled={!scene.imageUrl || scene.isGeneratingVideo}
                                className="flex-grow bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors text-sm overflow-hidden"
                            >
                               {scene.isGeneratingVideo ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span className="truncate">{scene.videoGenerationProgress || 'Generating...'}</span>
                                </>
                               ) : (
                                <>
                                    <VideoIcon />
                                    <span>Video Motion Prompt</span>
                                </>
                               )}
                            </button>
                            <button
                                onClick={handleCopyPrompt}
                                disabled={!scene.imageUrl || scene.isGeneratingVideo}
                                title="Copy video motion prompt"
                                className="flex-shrink-0 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2.5 rounded-md transition-colors"
                            >
                                {promptCopied ? <CheckIcon /> : <CopyIcon />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};