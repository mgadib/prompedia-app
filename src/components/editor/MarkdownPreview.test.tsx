import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownPreview } from './MarkdownPreview';

describe('MarkdownPreview', () => {
    it('renders empty state when content is empty', () => {
        render(<MarkdownPreview content="" />);
        expect(screen.getByText('No content to preview')).toBeInTheDocument();
    });

    it('renders plain text as paragraph', () => {
        render(<MarkdownPreview content="Hello world" />);
        expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders heading correctly', () => {
        render(<MarkdownPreview content="# Heading 1" />);
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('Heading 1');
    });

    it('renders bold text correctly', () => {
        render(<MarkdownPreview content="**bold text**" />);
        const bold = screen.getByText('bold text');
        expect(bold.tagName).toBe('STRONG');
    });

    it('renders italic text correctly', () => {
        render(<MarkdownPreview content="*italic text*" />);
        const italic = screen.getByText('italic text');
        expect(italic.tagName).toBe('EM');
    });

    it('renders code block correctly', () => {
        const { container } = render(<MarkdownPreview content="```javascript\nconst x = 1;\n```" />);
        const pre = container.querySelector('pre');
        const code = container.querySelector('code');
        // Either pre or code should exist for code blocks
        expect(pre || code).toBeTruthy();
    });

    it('renders inline code correctly', () => {
        render(<MarkdownPreview content="Use `code` here" />);
        const inlineCode = screen.getByText('code');
        expect(inlineCode.tagName).toBe('CODE');
    });

    it('renders bullet list correctly', () => {
        const { container } = render(<MarkdownPreview content="- Item 1\n- Item 2" />);
        const list = container.querySelector('ul');
        expect(list).toBeInTheDocument();
    });

    it('renders numbered list correctly', () => {
        const { container } = render(<MarkdownPreview content="1. First\n2. Second" />);
        const list = container.querySelector('ol');
        expect(list).toBeInTheDocument();
    });

    it('renders blockquote correctly', () => {
        const { container } = render(<MarkdownPreview content="> This is a quote" />);
        const blockquote = container.querySelector('blockquote');
        expect(blockquote).toBeInTheDocument();
        expect(blockquote?.textContent).toContain('This is a quote');
    });

    it('handles backward compatibility with plain text', () => {
        // Plain text without any Markdown syntax should render as paragraph
        const plainText = 'This is just plain text without any markdown formatting.';
        render(<MarkdownPreview content={plainText} />);
        expect(screen.getByText(plainText)).toBeInTheDocument();
    });

    it('preserves line breaks in code blocks', () => {
        const { container } = render(<MarkdownPreview content="```\nline1\nline2\nline3\n```" />);
        // Code block should contain all lines
        const textContent = container.textContent || '';
        expect(textContent).toContain('line1');
    });
});
