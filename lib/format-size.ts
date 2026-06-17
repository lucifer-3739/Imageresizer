/**
 * Formats a file size in bytes to a human-readable string (e.g. 1.25 MB, 450 KB).
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Format to 2 decimal places, but drop trailing zeros if integer
  const formattedVal = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${formattedVal} ${sizes[i]}`;
}
