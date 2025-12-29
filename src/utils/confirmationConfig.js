export const shouldShowDeleteConfirmation = () => {
  return process.env.REACT_APP_DISABLE_DELETE_CONFIRMATION !== 'true';
};

export const handleDelete = (deleteFunction, showConfirmation = shouldShowDeleteConfirmation()) => {
  if (showConfirmation) {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteFunction();
    }
  } else {
    deleteFunction();
  }
};