/**
 * Lightweight pagination utilities for admin list endpoints.
 *
 * Pages are 1-indexed because that is what users expect in URLs and UI.
 * Defaults and caps are conservative — the admin console is read-only so
 * tight per-page limits keep the surface predictable.
 */

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function parsePageParams(query: {
  page?: string | string[];
  pageSize?: string | string[];
}): PageParams {
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const rawSize = Array.isArray(query.pageSize) ? query.pageSize[0] : query.pageSize;

  const page = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(rawSize ?? `${DEFAULT_PAGE_SIZE}`, 10) || DEFAULT_PAGE_SIZE)
  );

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginate<T>(data: T[], total: number, params: PageParams): Paginated<T> {
  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}
