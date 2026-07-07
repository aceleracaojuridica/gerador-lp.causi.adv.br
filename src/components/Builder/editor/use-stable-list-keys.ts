"use client";

import { useRef } from "react";

/**
 * Gera keys estáveis para listas editáveis que só sofrem append/remove.
 *
 * Mantém a mesma key por posição durante digitação para evitar perda de foco
 * nos inputs controlados. Quando o tamanho muda, tenta reaproveitar keys por
 * fingerprint antes de criar novos identificadores.
 */
export function useStableListKeys<T>(
  items: readonly T[],
  getFingerprint: (item: T) => string,
  prefix: string,
) {
  const nextIdRef = useRef(0);
  const previousRef = useRef<Array<{ fingerprint: string; key: string }>>([]);

  const currentFingerprints = items.map(getFingerprint);
  const previous = previousRef.current;
  const nextKeys: string[] = [];

  if (previous.length === currentFingerprints.length) {
    currentFingerprints.forEach((_, index) => {
      const existingKey = previous[index]?.key;
      if (existingKey) {
        nextKeys.push(existingKey);
        return;
      }
      nextIdRef.current += 1;
      nextKeys.push(`${prefix}-${nextIdRef.current}`);
    });
  } else {
    const usedPreviousIndexes = new Set<number>();

    currentFingerprints.forEach((fingerprint) => {
      const previousIndex = previous.findIndex(
        (entry, index) =>
          entry.fingerprint === fingerprint && !usedPreviousIndexes.has(index),
      );

      if (previousIndex >= 0) {
        usedPreviousIndexes.add(previousIndex);
        nextKeys.push(previous[previousIndex].key);
        return;
      }

      nextIdRef.current += 1;
      nextKeys.push(`${prefix}-${nextIdRef.current}`);
    });
  }

  previousRef.current = currentFingerprints.map((fingerprint, index) => ({
    fingerprint,
    key: nextKeys[index],
  }));

  return nextKeys;
}
