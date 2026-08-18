type IndexRequest = {
  id: string;
  file: File;
  query: string;
  chunkSize?: number;
};

type IndexResponse = {
  id: string;
  matches: number[];
  bytesRead: number;
};

self.onmessage = async (event: MessageEvent<IndexRequest>) => {
  const { id, file, query, chunkSize = 256 * 1024 } = event.data;
  const needle = query.trim().toLocaleLowerCase();
  const matches: number[] = [];
  let bytesRead = 0;

  if (!needle) {
    self.postMessage({ id, matches, bytesRead } satisfies IndexResponse);
    return;
  }

  for (let offset = 0; offset < file.size; offset += chunkSize) {
    const slice = file.slice(offset, Math.min(offset + chunkSize, file.size));
    const text = await slice.text();
    const haystack = text.toLocaleLowerCase();
    let cursor = 0;
    while (cursor < haystack.length) {
      const found = haystack.indexOf(needle, cursor);
      if (found === -1) break;
      matches.push(offset + found);
      cursor = found + needle.length;
    }
    bytesRead += slice.size;
    self.postMessage({ id, matches, bytesRead } satisfies IndexResponse);
  }
};

export {};