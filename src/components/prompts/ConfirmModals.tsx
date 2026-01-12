import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel?: string;
    variant?: 'default' | 'destructive';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Reusable confirmation modal component
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'default',
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    const finalCancelLabel = cancelLabel || t('actions.cancel');

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm" 
            onClick={onCancel}
        >
            <div 
                className="w-full max-w-sm bg-card border border-border rounded shadow-lg p-4 sm:p-5" 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{description}</p>
                <div className="flex justify-end gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onCancel}
                        aria-label={finalCancelLabel}
                    >
                        {finalCancelLabel}
                    </Button>
                    <Button 
                        variant={variant === 'destructive' ? 'destructive' : 'brand'} 
                        size="sm" 
                        onClick={onConfirm}
                        aria-label={confirmLabel}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
};

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Delete confirmation modal for prompts
 */
export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();

    return (
        <ConfirmModal
            isOpen={isOpen}
            title={t('prompt.delete_confirm')}
            description={t('prompt.delete_warning')}
            confirmLabel={t('actions.delete')}
            variant="destructive"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
};

interface LogoutConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * Logout confirmation modal
 */
export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();

    return (
        <ConfirmModal
            isOpen={isOpen}
            title={t('auth.logout_confirm_title')}
            description={t('auth.logout_confirm_desc')}
            confirmLabel={t('auth.logout')}
            variant="default"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
};
