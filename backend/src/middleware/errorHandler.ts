// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express'

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next)

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error('[ERROR]', err)
  const status = err.status ?? 500
  res.status(status).json({
    error: err.message ?? 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
