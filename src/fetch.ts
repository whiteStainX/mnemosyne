export async function fetchWithProgress(
    url: string,
    onProgress: (loadedBytes: number, totalBytes: number) => void
): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
        const body = await response.text();
        throw new Error(
            `Could not fetch URL, status=${response.status}, body=${body}`
        );
    }
    if (!response.body) {
        throw new Error("Could not fetch URL, no response body");
    }

    const contentLength = parseInt(
        response.headers.get("Content-Length") ?? ""
    );
    const totalBytes = isNaN(contentLength) ? 0 : contentLength;

    onProgress(0, totalBytes);

    const reader = response.body.getReader();
    let loaded = 0;
    const stream = new ReadableStream({
        async start(controller) {
            for (;;) {
                const {done, value} = await reader.read();
                if (done) {
                    break;
                }
                loaded += value.length;
                onProgress(loaded, totalBytes);
                controller.enqueue(value);
            }
            controller.close();
        },
    });

    const blob = await new Response(stream).blob();
    onProgress(blob.size, blob.size);
    return blob;
}
