'use client';

import { Card } from '@/components/ui/Card';
import type { PredictionResult } from '@/types';

interface PredictionDisplayProps {
  prediction: PredictionResult | null;
  loading?: boolean;
}

export function PredictionDisplay({ prediction, loading }: PredictionDisplayProps) {
  if (loading) {
    return (
      <Card padding="md">
        <p className="text-neutral-600 dark:text-neutral-400">
          Calculating prediction...
        </p>
      </Card>
    );
  }

  if (!prediction) {
    return null;
  }

  const hasRating = prediction.predictedRating !== null;

  return (
    <Card padding="lg">
      <h3 className="text-lg font-medium mb-4">Predicted Rating</h3>

      {hasRating ? (
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              {prediction.predictedRating?.toFixed(1)}
            </span>
            <span className="text-neutral-500">/ 5.0</span>
          </div>
          {prediction.confidence !== null && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Confidence: {Math.round(prediction.confidence * 100)}%
            </p>
          )}
        </div>
      ) : (
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Not available
        </p>
      )}

      {prediction.rationale.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            {hasRating ? 'Why this rating?' : 'Why no prediction?'}
          </h4>
          <ul className="space-y-1">
            {prediction.rationale.map((item, i) => (
              <li
                key={i}
                className="text-sm text-neutral-600 dark:text-neutral-400"
              >
                {item.message || item.type}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
