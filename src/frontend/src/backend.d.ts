import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface SentenceResult {
    text: string;
    aiScore: number;
}

export interface AnalysisResult {
    overallScore: number;
    sentences: SentenceResult[];
    classification: string;
    explanation: string;
}

export interface backendInterface {
    /** Returns a detailed AI detection analysis including per-sentence scores. */
    analyzeText(text: string): Promise<AnalysisResult>;
    /** Returns a score between 0 and 1 indicating AI likelihood. */
    getScore(text: string): Promise<number>;
}
