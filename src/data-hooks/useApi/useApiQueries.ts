import { useQueries, UseQueryResult } from 'react-query';
import { getQueryCachekey } from '../constants';
import { makeGetRequest } from '../makeRequest';

export function useApiQueries<T, P>(
  input: T[],
  pathFn: (accessorValue: T[keyof T]) => string,
  accessor: keyof T,
  dataTransformer = (data: unknown): P => data as P
): Pick<
  UseQueryResult<Record<string, P>, unknown>,
  'data' | 'error' | 'isLoading'
> {
  const queryResults = useQueries(
    input.map(inputItem => ({
      queryKey: getQueryCachekey(pathFn(inputItem[accessor])),
      queryFn: async () => {
        return dataTransformer(
          await makeGetRequest(pathFn(inputItem[accessor]))
        ) as P;
      },
    }))
  );

  const recordedData = (): Record<keyof T, P> => {
    if (queryResults.some(({ isLoading }) => isLoading)) {
      return {} as Record<keyof T, P>;
    }
    return Object.fromEntries(
      input.map((_, index) => [
        input[index][accessor],
        queryResults[index].data,
      ])
    );
  };

  const findFirst = (key: keyof UseQueryResult) =>
    queryResults.find(queryResultsItem => queryResultsItem[key])?.[key];

  return {
    error: findFirst('error'),
    isLoading: !!findFirst('isLoading'),
    data: recordedData(),
  };
}