import { Request, Response, NextFunction } from "express";
import petService from "../services/pet.service";
import AppError from "../utils/AppError";
import {
  collectUploadedFiles,
  deleteUploadedFiles,
  getUploadedImageUrl,
} from "../middleware/upload.middleware";

class PetController {

  async createPet(req: Request, res: Response, next: NextFunction) {
    const uploadedFiles = collectUploadedFiles(req);

    try {
      const owner_id = (req.user?.role === "admin" && req.body.owner_id)
        ? Number(req.body.owner_id)
        : Number(req.user?.user_id);

      if (!owner_id || isNaN(owner_id)) {
        throw new AppError("Không tìm thấy thông tin chủ thú cưng hợp lệ", 400);
      }

      const uploadedAvatarUrl =
        getUploadedImageUrl(req, "avatar") ||
        getUploadedImageUrl(req, "petAvatar");

      const petData = {
        ...req.body,
        ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
        owner_id,
      };

      const pet = await petService.createPet(petData);

      return res.status(201).json({
        success: true,
        data: pet,
      });
    } catch (error) {
      await deleteUploadedFiles(uploadedFiles);
      next(error);
    }
  }

  async getMyPets(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const pets = await petService.getPetsByOwner(
        req.user.user_id
      );

      return res.json({
        success: true,
        data: pets,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPetById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const pet = await petService.getPetById(
        Number(req.params.id),
        req.user.user_id,
        req.user.role
      );

      return res.json({
        success: true,
        data: pet,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const uploadedFiles = collectUploadedFiles(req);

    try {
      const uploadedAvatarUrl =
        getUploadedImageUrl(req, "avatar") ||
        getUploadedImageUrl(req, "petAvatar");

      const updateData = {
        ...req.body,
        ...(uploadedAvatarUrl ? { avatar_url: uploadedAvatarUrl } : {}),
      };

      const pet = await petService.updatePet(
        Number(req.params.id),
        req.user.user_id,
        updateData,
        req.user.role
      );

      return res.json({
        success: true,
        data: pet,
      });
    } catch (error) {
      await deleteUploadedFiles(uploadedFiles);
      next(error);
    }
  }

  async deletePet(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await petService.deletePet(
        Number(req.params.id),
        req.user.user_id,
        req.user.role
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PetController();