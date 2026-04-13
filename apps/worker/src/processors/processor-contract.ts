export interface ProcessorRunResult {
  handled: number;
  summary: string;
}

export interface WorkerProcessor {
  readonly name: string;
  run(): Promise<ProcessorRunResult>;
}