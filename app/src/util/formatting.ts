export function formatTimestamp(timestamp: number) : string {
    return new Date(timestamp).toDateString();
}