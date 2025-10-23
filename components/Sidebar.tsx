
import React, { useState, useCallback, ChangeEvent } from 'react';
import { AspectRatio } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { FilmIcon } from './icons/FilmIcon';

interface SidebarProps {
    setReferenceImage: (file: File | null) => void;
    story: string;
    setStory: (story: string) => void;
    numScenes: number;
    setNumScenes: (num: number) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
    onGenerate: () => void;
    isLoading: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
    setReferenceImage,
    story,
    setStory,
    numScenes,
    setNumScenes,
    aspectRatio,
    setAspectRatio,
    onGenerate,
    isLoading
}) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setReferenceImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [setReferenceImage]);

    return (
        <aside className="w-full md:w-96 bg-gray-900 border border-gray-800 rounded-lg p-6 flex flex-col gap-6 self-start">
            <div className="flex items-center gap-3">
                <div className="bg-green-900/50 text-green-400 p-2 rounded-lg">
                    <SparklesIcon />
                </div>
                <div>
                    <span className="text-sm text-green-400">AI Generator</span>
                    <h2 className="text-xl font-bold text-white">Film Maker</h2>
                </div>
            </div>
            
            <p className="text-gray-400 text-sm">
                Generate cinematic scene variations from a single reference image.
            </p>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reference Image</label>
                <div 
                    className="relative border-2 border-dashed border-gray-600 rounded-lg h-48 flex items-center justify-center text-center cursor-pointer hover:border-green-500 transition-colors"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                >
                    <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    {imagePreview ? (
                        <img src={imagePreview} alt="Reference Preview" className="absolute inset-0 w-full h-full object-cover rounded-lg" />
                    ) : (
                        <div className="text-gray-500 flex flex-col items-center">
                            <UploadIcon />
                            <p>Click to upload</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="story" className="block text-sm font-medium text-gray-300 mb-2">Story Description</label>
                <textarea
                    id="story"
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    placeholder="e.g., A programmer discovers a secret message in her code..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                />
            </div>
            
            <div>
                <label htmlFor="numScenes" className="block text-sm font-medium text-gray-300 mb-2">Number of Scenes: <span className="font-bold text-green-400">{numScenes}</span></label>
                <input
                    id="numScenes"
                    type="range"
                    min="5"
                    max="20"
                    step="1"
                    value={numScenes}
                    onChange={(e) => setNumScenes(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
            </div>
            
            <div>
                 <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                 <select 
                    id="aspectRatio"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                 >
                    <option value="9:16">9:16 (Vertical)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                 </select>
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
            >
                {isLoading ? (
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                    <>
                        <FilmIcon />
                        <span>Generate {numScenes} Scenes</span>
                    </>
                )}
            </button>
        </aside>
    );
};
