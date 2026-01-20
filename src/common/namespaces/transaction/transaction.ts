import { createNamespace } from 'cls-hooked';
import { DataSource, EntityManager } from 'typeorm';

export const TRANSACTION_NAMESPACE = 'transaction';
export const transactionNamespace = createNamespace(TRANSACTION_NAMESPACE);

/**
 * Helper to run work inside a DB transaction.
 */
export async function withTransaction<T>(
  dataSource: DataSource,
  work: (entityManager: EntityManager) => Promise<T>,
): Promise<T> {
  return dataSource.transaction(async (entityManager) => {
    return work(entityManager);
  });
}

export function getTransactionManager(): EntityManager | undefined {
  return transactionNamespace.get('entityManager') as EntityManager | undefined;
}
