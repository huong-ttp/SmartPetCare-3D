import { Request, Response, NextFunction } from "express";
import petService from "../services/pet.service";

class PetController {

  async createPet(req: Request, res: Response) {

    const owner_id = req.user.user_id;

    const pet = await petService.createPet({
      owner_id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      data: pet,
    });
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
      req.user.user_id
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
  try {
    const pet = await petService.updatePet(
      Number(req.params.id),
      req.user.user_id,
      req.body
    );

    return res.json({
      success: true,
      data: pet,
    });
  } catch (error) {
    next(error);
  }
}
}

export default new PetController();