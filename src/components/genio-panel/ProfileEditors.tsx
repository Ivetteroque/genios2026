import React, { useState } from 'react';
import { updateMyGeniusProfile } from '../../services/geniusPanelService';
import { showToast } from '../../utils/toast';
import { EditorShell } from './ui';
import { PART_COPY, PartFields, draftFromProfile, patchFor, validatePart, type ProfileDraft } from './profileParts';
import type { PanelGeniusProfile, ProfilePart } from './types';

/**
 * Editar una parte del perfil desde "Mi perfil": una cosa por pantalla, solo
 * sus campos, y se guardan solo esos datos.
 */

interface ProfileEditorProps {
  part: ProfilePart;
  profile: PanelGeniusProfile;
  onDone: () => void;
  onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ part, profile, onDone, onCancel }) => {
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromProfile(profile));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors = tried ? validatePart(part, draft) : {};

  const save = async () => {
    setTried(true);
    if (Object.keys(validatePart(part, draft)).length > 0) return;
    setSaving(true);
    try {
      await updateMyGeniusProfile(profile.id, patchFor(part, draft));
      showToast('Cambios guardados');
      onDone();
    } catch (error) {
      console.error('Error guardando el perfil:', error);
      showToast('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditorShell title={PART_COPY[part].title} subtitle={PART_COPY[part].subtitle} saving={saving} onSave={save} onCancel={onCancel}>
      <PartFields part={part} draft={draft} set={(patch) => setDraft((d) => ({ ...d, ...patch }))} errors={errors} />
    </EditorShell>
  );
};

export default ProfileEditor;
