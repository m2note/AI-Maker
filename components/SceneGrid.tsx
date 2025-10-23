
import React from 'react';
import { Scene } from '../types';
import { SceneCard } from './SceneCard';

interface SceneGridProps {
    scenes: Scene[];
    onGenerateVideo: (sceneId: number) => void;
}

export const SceneGrid: React.FC<SceneGridProps> = ({ scenes, onGenerateVideo }) => {
    if (scenes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Your generated scenes will appear here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {scenes.map(scene => (
                <SceneCard key={scene.id} scene={scene} onGenerateVideo={onGenerateVideo} />
            ))}
        </div>
    );
};
