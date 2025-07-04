import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { services } from '@/services';

export const useApplicationCreate = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const openDialog = useCallback(() => {
    setNewName('');
    setNewDesc('');
    setDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (!creating) setDialogOpen(false);
  }, [creating]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    setCreating(true);

    try {
      const createdApp = await services.application.create({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      closeDialog();
      navigate(`/applications/${createdApp.id}`);
    } catch (err) {
      console.error('Create failed', err);
      setCreateError(err instanceof Error ? err.message : 'Failed to create application');
    } finally {
      setCreating(false);
    }
  }, [newName, newDesc, navigate, closeDialog]);

  return {
    dialogOpen,
    openDialog,
    closeDialog,
    createError,
    newName,
    setNewName,
    newDesc,
    setNewDesc,
    creating,
    handleCreate,
  };
};
