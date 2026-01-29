/**
 * PromptNotes Context Provider
 * 
 * Manages shared state for PromptNotes component tree.
 * This reduces prop drilling and improves maintainability.
 */

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { PromptUI, Tag } from '@/types/prompts';

interface PromptNotesContextValue {
    // Editor state
    title: string;
    setTitle: (title: string) => void;
    content: string;
    setContent: (content: string) => void;
    tagsInput: string;
    setTagsInput: (tags: string) => void;
    isPublic: boolean;
    setIsPublic: (isPublic: boolean) => void;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    
    // Selection state
    selectedPrompt: PromptUI | null;
    setSelectedPrompt: (prompt: PromptUI | null) => void;
    confirmDeleteId: string | null;
    setConfirmDeleteId: (id: string | null) => void;
    copiedId: string | null;
    setCopiedId: (id: string | null) => void;
    sharedId: string | null;
    setSharedId: (id: string | null) => void;
    
    // Filter & Pagination state
    searchText: string;
    setSearchText: (text: string) => void;
    selectedTag: string | null;
    setSelectedTag: (tag: string | null) => void;
    visibilityFilter: 'all' | 'public' | 'private';
    setVisibilityFilter: (filter: 'all' | 'public' | 'private') => void;
    itemsPerPage: number;
    setItemsPerPage: (items: number) => void;
    currentPage: number;
    setCurrentPage: (page: number) => void;
    
    // Public prompts state
    selectedPublicTag: string | null;
    setSelectedPublicTag: (tag: string | null) => void;
    publicCurrentPage: number;
    setPublicCurrentPage: (page: number) => void;
    publicItemsPerPage: number;
    setPublicItemsPerPage: (items: number) => void;
    
    // Refs
    searchInputRef: React.RefObject<HTMLInputElement>;
    
    // Helper functions
    resetEditor: () => void;
    handleEdit: (prompt: PromptUI) => void;
}

const PromptNotesContext = createContext<PromptNotesContextValue | undefined>(undefined);

interface PromptNotesProviderProps {
    children: ReactNode;
}

export function PromptNotesProvider({ children }: PromptNotesProviderProps) {
    // Editor state
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tagsInput, setTagsInput] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Selection state
    const [selectedPrompt, setSelectedPrompt] = useState<PromptUI | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [sharedId, setSharedId] = useState<string | null>(null);
    
    // Filter & Pagination state
    const [searchText, setSearchText] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Public prompts state
    const [selectedPublicTag, setSelectedPublicTag] = useState<string | null>(null);
    const [publicCurrentPage, setPublicCurrentPage] = useState(1);
    const [publicItemsPerPage, setPublicItemsPerPage] = useState(10);
    
    // Refs
    const searchInputRef = useRef<HTMLInputElement>(null);
    
    // Helper functions
    const resetEditor = useCallback(() => {
        setTitle('');
        setContent('');
        setTagsInput('');
        setIsPublic(false);
        setEditingId(null);
    }, []);
    
    const handleEdit = useCallback((prompt: PromptUI) => {
        setTitle(prompt.title);
        setContent(prompt.content);
        setTagsInput(prompt.tags.map(t => t.name).join(', '));
        setIsPublic(Boolean(prompt.is_public));
        setEditingId(prompt.id);
        setSelectedPrompt(null);
    }, []);
    
    const value: PromptNotesContextValue = {
        title,
        setTitle,
        content,
        setContent,
        tagsInput,
        setTagsInput,
        isPublic,
        setIsPublic,
        editingId,
        setEditingId,
        selectedPrompt,
        setSelectedPrompt,
        confirmDeleteId,
        setConfirmDeleteId,
        copiedId,
        setCopiedId,
        sharedId,
        setSharedId,
        searchText,
        setSearchText,
        selectedTag,
        setSelectedTag,
        visibilityFilter,
        setVisibilityFilter,
        itemsPerPage,
        setItemsPerPage,
        currentPage,
        setCurrentPage,
        selectedPublicTag,
        setSelectedPublicTag,
        publicCurrentPage,
        setPublicCurrentPage,
        publicItemsPerPage,
        setPublicItemsPerPage,
        searchInputRef,
        resetEditor,
        handleEdit,
    };
    
    return (
        <PromptNotesContext.Provider value={value}>
            {children}
        </PromptNotesContext.Provider>
    );
}

/**
 * Hook to access PromptNotes context
 */
export function usePromptNotesContext(): PromptNotesContextValue {
    const context = useContext(PromptNotesContext);
    if (!context) {
        throw new Error('usePromptNotesContext must be used within PromptNotesProvider');
    }
    return context;
}
