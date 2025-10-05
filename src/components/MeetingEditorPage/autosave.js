// Auto-save functionality for meeting editor
export const setupAutoSave = (meetingId, getMeetingData, updateMeeting, interval = 30000) => {
  let autoSaveTimer = null;
  let lastSavedData = null;

  const autoSave = async () => {
    try {
      const currentData = getMeetingData();
      
      // Only save if data has changed
      if (JSON.stringify(currentData) !== JSON.stringify(lastSavedData)) {
        console.log('Auto-saving meeting...');
        
        // Save to localStorage first for immediate backup
        localStorage.setItem(`meeting-${meetingId}`, JSON.stringify(currentData));
        
        // Then save to server if not a new meeting
        if (meetingId && meetingId !== 'new') {
          await updateMeeting(meetingId, currentData);
          console.log('Auto-save completed');
        }
        
        lastSavedData = { ...currentData };
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Keep localStorage backup even if server save fails
    }
  };

  const startAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
    }
    autoSaveTimer = setInterval(autoSave, interval);
  };

  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
  };

  const saveNow = () => {
    return autoSave();
  };

  return {
    startAutoSave,
    stopAutoSave,
    saveNow
  };
};