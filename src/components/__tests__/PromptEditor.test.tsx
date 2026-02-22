/**
 * Component tests for PromptEditor
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PromptEditor } from '../prompts/PromptEditor';
import { useTranslation } from 'react-i18next';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PromptEditor', () => {
  const defaultProps = {
    title: '',
    setTitle: vi.fn(),
    content: '',
    setContent: vi.fn(),
    tagsInput: '',
    setTagsInput: vi.fn(),
    isPublic: false,
    setIsPublic: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn(),
    isEditing: false,
    saving: false,
  };

  it('should render editor with all inputs', async () => {
    render(<PromptEditor {...defaultProps} />);

    expect(screen.getByPlaceholderText('prompt.title_placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('prompt.tags_placeholder')).toBeInTheDocument();
    // MarkdownEditor is lazy-loaded; wait for TipTap toolbar to appear
    await waitFor(
      () => {
        expect(screen.getByTitle(/editor\.toolbar\.bold/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('should display public badge when isPublic is true', () => {
    render(<PromptEditor {...defaultProps} isPublic={true} />);
    expect(screen.getAllByText('prompt.public').length).toBeGreaterThan(0);
  });

  it('should display private badge when isPublic is false', () => {
    render(<PromptEditor {...defaultProps} isPublic={false} />);
    expect(screen.getByText('prompt.private')).toBeInTheDocument();
  });

  it('should disable save button when content is empty', () => {
    render(<PromptEditor {...defaultProps} content="" />);
    const saveButton = screen.getByRole('button', { name: 'prompt.save' });
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when content is provided', () => {
    render(<PromptEditor {...defaultProps} content="Test content" />);
    const saveButton = screen.getByRole('button', { name: 'prompt.save' });
    expect(saveButton).not.toBeDisabled();
  });

  it('should show cancel button when editing', () => {
    render(<PromptEditor {...defaultProps} isEditing={true} />);
    expect(screen.getByText('prompt.cancel_edit')).toBeInTheDocument();
  });

  it('should not show cancel button when creating new prompt', () => {
    render(<PromptEditor {...defaultProps} isEditing={false} />);
    expect(screen.queryByText('prompt.cancel_edit')).not.toBeInTheDocument();
  });
});
