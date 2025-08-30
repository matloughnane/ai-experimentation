import { Request, Response, NextFunction } from "express";

export const getHealthcheck = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    res.json({
      title: process.env.TITLE || "Express API",
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      title: process.env.TITLE || "Express API",
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }
};
