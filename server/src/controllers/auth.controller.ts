import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";
import AppError from "../utils/AppError";
import { RegisterInput } from "../validations/auth.validation";
import {
  collectUploadedFiles,
  deleteUploadedFiles,
  getUploadedImageUrl,
} from "../middleware/upload.middleware";

class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    // Ảnh đã được Multer đẩy lên Cloudinary trước khi vào controller.
    // Giữ lại danh sách để rollback (xóa ảnh) nếu nghiệp vụ thất bại.
    const uploadedFiles = collectUploadedFiles(req);

    try {
      const body = req.body as RegisterInput;

      // URL HTTPS của ảnh trên Cloudinary (đã bật f_auto, q_auto) — thay thế Base64
      const userAvatarUrl = getUploadedImageUrl(req, "avatar");
      const petAvatarUrl = getUploadedImageUrl(req, "petAvatar");

      if (petAvatarUrl && !body.pet_name) {
        throw new AppError(
          "Vui lòng nhập tên và loài thú cưng khi tải ảnh thú cưng lên",
          400
        );
      }

      const result = await authService.register({
        full_name: body.full_name,
        email: body.email,
        password: body.password,
        phone: body.phone,
        address: body.address,
        avatar_url: userAvatarUrl,
        pet:
          body.pet_name && body.pet_species
            ? {
                name: body.pet_name,
                species: body.pet_species,
                breed: body.pet_breed,
                gender: body.pet_gender ?? "unknown",
                avatar_url: petAvatarUrl,
              }
            : null,
      });

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      await deleteUploadedFiles(uploadedFiles);
      next(error);
    }
  }
  async login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.login(req.body);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
async refresh(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.refreshToken(
      req.body.refresh_token
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
async me(
  req: Request,
  res: Response
) {
  return res.json({
    success: true,
    data: (req as any).user,
  });
}
async profile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await authService.getProfile(
      req.user.user_id
    );

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
async logout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const refreshToken = req.body?.refresh_token;
    const userId = req.user?.user_id;
    const result = await authService.logout(refreshToken, userId);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
async forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.forgotPassword(
      req.body
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result =
      await authService.resetPassword(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
}

export default new AuthController();