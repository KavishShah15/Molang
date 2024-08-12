declare module 'dompurify' {
    function sanitize(dirty: string, options?: Record<string, any>): string;
    export { sanitize };
}
