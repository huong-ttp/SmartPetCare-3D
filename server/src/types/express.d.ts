import "express";

declare global {
  namespace Express {
    interface Request {
      user: {
        user_id: number;
        role: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};