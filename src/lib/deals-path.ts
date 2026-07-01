/**
 * Monta o href do Kanban de deals (`/oportunidades`).
 *
 * @param pipelineId - Id do funil ativo (ex.: cookie `causi_pipeline`). `null`/`undefined` → resolve no server.
 * @returns `/oportunidades/{id}` ou `/oportunidades` (redirect define o funil inicial).
 */
export function dealsPath(pipelineId: number | null | undefined): string {
  return pipelineId ? `/oportunidades/${pipelineId}` : "/oportunidades";
}
