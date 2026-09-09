export interface ExternalImageImportResult {
    files: File[];
    failedCount: number;
}

export const importExternalImages = async (
    urls: string[],
    importer: (url: string) => Promise<File>,
    onProgress: (completed: number) => void,
    concurrency = 4,
): Promise<ExternalImageImportResult> => {
    const results: Array<File | null> = Array(urls.length).fill(null);
    let nextIndex = 0;
    let completed = 0;

    const worker = async () => {
        while (nextIndex < urls.length) {
            const index = nextIndex;
            nextIndex += 1;

            try {
                results[index] = await importer(urls[index]);
            } catch {
                results[index] = null;
            } finally {
                completed += 1;
                onProgress(completed);
            }
        }
    };

    await Promise.all(
        Array.from(
            { length: Math.min(Math.max(1, concurrency), urls.length) },
            worker,
        ),
    );

    const files = results.filter((file): file is File => file !== null);
    return { files, failedCount: urls.length - files.length };
};

