import jwt, { Secret, SignOptions } from "jsonwebtoken";

export const generateAccessToken = (
  payload: {
    user_id: number;
    role: string;
  }
) => {
  const secret: Secret = process.env.JWT_SECRET!;

  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, secret, options);
};