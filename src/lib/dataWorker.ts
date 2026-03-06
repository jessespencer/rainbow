// Web Worker: loads references JSON, bins by (sourceBook, targetBook, category)

export interface Reference {
  s: [number, number, number]; // [bookIndex, chapter, verse]
  t: [number, number, number];
  cat: number;
}

export interface Bin {
  sourceBook: number;
  targetBook: number;
  category: number;
  count: number;
  refIndices: number[];
}

export interface WorkerResult {
  type: 'progress' | 'ready';
  progress?: number;
  bins?: Bin[];
  references?: Reference[];
  totalCount?: number;
}

export interface WorkerCommand {
  type: 'load';
  url: string;
}

function binReferences(refs: Reference[]): Bin[] {
  // Key: "srcBook-tgtBook-cat"
  const map = new Map<string, Bin>();

  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    const src = Math.min(ref.s[0], ref.t[0]);
    const tgt = Math.max(ref.s[0], ref.t[0]);
    const cat = ref.cat;
    const key = `${src}-${tgt}-${cat}`;

    let bin = map.get(key);
    if (!bin) {
      bin = { sourceBook: src, targetBook: tgt, category: cat, count: 0, refIndices: [] };
      map.set(key, bin);
    }
    bin.count++;
    bin.refIndices.push(i);
  }

  return Array.from(map.values());
}

self.onmessage = async (e: MessageEvent<WorkerCommand>) => {
  if (e.data.type === 'load') {
    self.postMessage({ type: 'progress', progress: 10 } as WorkerResult);

    const resp = await fetch(e.data.url);
    self.postMessage({ type: 'progress', progress: 40 } as WorkerResult);

    const refs: Reference[] = await resp.json();
    self.postMessage({ type: 'progress', progress: 70 } as WorkerResult);

    const bins = binReferences(refs);
    self.postMessage({ type: 'progress', progress: 90 } as WorkerResult);

    self.postMessage({
      type: 'ready',
      bins,
      references: refs,
      totalCount: refs.length,
    } as WorkerResult);
  }
};
