/**
 * Generate a shareable URL that uses the production domain if available,
 * otherwise falls back to the current window location origin.
 * 
 * @param path The path to append to the domain (should start with a slash)
 * @returns The full absolute URL
 */
export const getShareUrl = (path: string): string => {
  // Always use current origin to ensure links work perfectly in any environment
  const baseUrl = window.location.origin;
  
  // Ensure we don't have double slashes when joining
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${cleanBaseUrl}${cleanPath}`;
};

/**
 * Copy text to clipboard and handle fallback
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};
