/**
 * Navigate to a specific URL
 * Extracted to a utility function to facilitate mocking in tests
 */
export const navigateTo = (url: string): void => {
    window.location.href = url;
};
