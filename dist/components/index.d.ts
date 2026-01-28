import React from 'react';

interface AltTextGeneratorProps {
    collectionSlug: string;
    options: {
        batchSize: number;
        altFieldName: string;
    };
}
declare const AltTextGenerator: React.FC<AltTextGeneratorProps>;

interface ImageWithoutAlt {
    id: string;
    filename: string;
    url: string;
    alt: string | null;
}
interface AltTextSuggestion {
    id: string;
    filename: string;
    imageUrl: string;
    suggestedAlt: string;
    status: 'pending' | 'generating' | 'ready' | 'saved' | 'error';
    error?: string;
}

interface AltTextModalProps {
    images: ImageWithoutAlt[];
    collectionSlug: string;
    batchSize: number;
    onComplete: () => void;
    onClose: () => void;
}
declare const AltTextModal: React.FC<AltTextModalProps>;

interface ImageRowProps {
    image: ImageWithoutAlt;
    suggestion?: AltTextSuggestion;
    collectionSlug: string;
    onGenerate: () => void;
    onUpdate: (newAlt: string) => void;
    onSave: (newAlt: string) => Promise<void>;
}
declare const ImageRow: React.FC<ImageRowProps>;

interface GenerateAltButtonProps {
    collectionSlug: string;
    altFieldName: string;
}
declare const GenerateAltButton: React.FC<GenerateAltButtonProps>;

export { AltTextGenerator, AltTextModal, GenerateAltButton, ImageRow };
