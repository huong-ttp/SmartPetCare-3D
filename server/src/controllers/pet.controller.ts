import { Request, Response } from "express";
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

}

export default new PetController();