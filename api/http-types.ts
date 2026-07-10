/**
 * Minimal, dependency-free request/response shapes.
 *
 * Both Vercel's Node.js runtime and Express hand handlers an object that is a
 * superset of these fields, so typing against this tiny interface (instead of
 * pulling in the full `@vercel/node` package as a dependency) keeps the
 * project lean while still catching real typos at compile time.
 */
export interface GenericApiRequest {
  method?: string;
  body?: any;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string | string[] | undefined>;
}

export interface GenericApiResponse {
  status: (code: number) => GenericApiResponse;
  json: (body: any) => void | GenericApiResponse;
  setHeader: (name: string, value: string) => void;
}
