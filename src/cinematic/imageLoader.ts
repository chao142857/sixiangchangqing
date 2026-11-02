type Priority = 'high' | 'low';
type ImageJob = {
  url: string;
  priority: Priority;
  state: 'queued' | 'loading' | 'ready';
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
  image?: HTMLImageElement;
};

// Keep decoded images alive and share requests between background warming and clicks.
const jobs = new Map<string, ImageJob>();
const queue: ImageJob[] = [];
let active = 0;
const concurrency = 4;

async function load(job: ImageJob) {
  const image = new Image();
  job.image = image;
  image.decoding = 'async';
  image.fetchPriority = job.priority;
  const downloaded = new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Image unavailable: ${job.url}`));
  });
  image.src = job.url;
  await downloaded;
  if (image.decode) await image.decode();
  if (!image.naturalWidth) throw new Error(`Image has no pixels: ${job.url}`);
}

function pump() {
  queue.sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high'));
  while (active < concurrency && queue.length) {
    const job = queue.shift()!;
    job.state = 'loading'; active++;
    void load(job).then(() => {
      job.state = 'ready'; job.resolve();
    }, error => {
      jobs.delete(job.url); job.reject(error);
    }).then(() => { active--; pump(); });
  }
}

export function imagesReady(urls: readonly string[]) {
  return urls.every(url => !url || jobs.get(url)?.state === 'ready');
}

export function prepareImages(urls: readonly string[], priority: Priority = 'high') {
  const promises = [...new Set(urls.filter(Boolean))].map(url => {
    let job = jobs.get(url);
    if (!job) {
      let resolve!: () => void;
      let reject!: (error: Error) => void;
      const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
      job = { url, priority, state: 'queued', promise, resolve, reject };
      jobs.set(url, job); queue.push(job);
    } else if (priority === 'high') {
      job.priority = 'high';
      if (job.image) job.image.fetchPriority = 'high';
    }
    return job.promise;
  });
  pump();
  return Promise.all(promises).then(() => undefined);
}
