export const getMatrixAuthFromLocalStorage = () => {
  const matrixAccessToken = localStorage.getItem('matrixAccessToken');
  const matrixUserId = localStorage.getItem('matrixUserId');
  return {
    matrixAccessToken: matrixAccessToken ? JSON.parse(matrixAccessToken) : null,
    matrixUserId: matrixUserId ? JSON.parse(matrixUserId) : null,
  };
};

export const saveMatrixAuthToLocalStorage = (accessToken: string, userId: string) => {
  localStorage.setItem('matrixAccessToken', JSON.stringify(accessToken));
  localStorage.setItem('matrixUserId', JSON.stringify(userId));
};

export const clearMatrixAuthFromLocalStorage = () => {
  localStorage.removeItem('matrixAccessToken');
  localStorage.removeItem('matrixUserId');
};

export const formatTimestamp = (timestamp: number, fullDate = false): string => {
  const messageDate = new Date(timestamp);
  const now = new Date();

  const isToday =
    messageDate.getDate() === now.getDate() &&
    messageDate.getMonth() === now.getMonth() &&
    messageDate.getFullYear() === now.getFullYear();

  if (isToday && !fullDate) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return `${messageDate.toLocaleDateString()} ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
};
