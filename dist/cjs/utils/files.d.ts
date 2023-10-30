export function fileLock(pathFolder: string, file: string, lock_retry_interval?: int): Promise<any>;
export function fileUnlock(pathFolder: string, file: string): Promise<any>;
