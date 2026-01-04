import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { requireRole, UserRole } from "../rbac";
import { 
  handleValidationError
} from "./common";
import { 
  insertCourseSchema, 
  insertCourseModuleSchema, 
  insertCourseLessonSchema,
  insertCourseEnrollmentSchema
} from "@shared/schema";
import { z } from "zod";

const router = Router();

// Course routes
router.get("/", async (req: Request, res: Response) => {
  try {
    const creatorId = req.query.creatorId as string;
    const courses = await storage.getCourses(creatorId);
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch courses" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const course = await storage.getCourse(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/content", async (req: Request, res: Response) => {
  try {
    const courseWithContent = await storage.getCourseWithContent(req.params.id);
    res.json(courseWithContent);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", isAuthenticated, requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.CREATOR), async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = insertCourseSchema.parse({
      ...req.body,
      creatorId: user.role === UserRole.CREATOR ? user.creatorId : req.body.creatorId
    });
    
    if (user.role === UserRole.CREATOR && !user.creatorId) {
      return res.status(403).json({ message: "Creator profile not found" });
    }

    const course = await storage.createCourse(data);
    res.status(201).json(course);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.patch("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const course = await storage.getCourse(req.params.id);
    
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    // Check if user is owner or admin
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER && course.creatorId !== user.creatorId) {
      return res.status(403).json({ message: "Not authorized to update this course" });
    }

    const data = insertCourseSchema.partial().parse(req.body);
    const updated = await storage.updateCourse(req.params.id, data);
    res.json(updated);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.delete("/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const course = await storage.getCourse(req.params.id);
    
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER && course.creatorId !== user.creatorId) {
      return res.status(403).json({ message: "Not authorized to delete this course" });
    }

    await storage.deleteCourse(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Module routes
router.post("/:courseId/modules", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const course = await storage.getCourse(req.params.courseId);
    
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER && course.creatorId !== user.creatorId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const data = insertCourseModuleSchema.parse({ ...req.body, courseId: req.params.courseId });
    const module = await storage.createCourseModule(data);
    res.status(201).json(module);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.patch("/modules/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const data = insertCourseModuleSchema.partial().parse(req.body);
    const updated = await storage.updateCourseModule(req.params.id, data);
    res.json(updated);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.delete("/modules/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    await storage.deleteCourseModule(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Lesson routes
router.post("/modules/:moduleId/lessons", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const data = insertCourseLessonSchema.parse({ ...req.body, moduleId: req.params.moduleId });
    const lesson = await storage.createCourseLesson(data);
    res.status(201).json(lesson);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.patch("/lessons/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const data = insertCourseLessonSchema.partial().parse(req.body);
    const updated = await storage.updateCourseLesson(req.params.id, data);
    res.json(updated);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.delete("/lessons/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    await storage.deleteCourseLesson(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Enrollment routes
router.get("/enrollments/me", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const enrollments = await storage.getUserEnrollments(user.id);
    res.json(enrollments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/enrollments/:courseId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const enrollment = await storage.getCourseEnrollment(req.params.courseId, user.id);
    res.json(enrollment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/enrollments", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = insertCourseEnrollmentSchema.parse({ ...req.body, userId: user.id });
    const enrollment = await storage.enrollInCourse(data);
    res.status(201).json(enrollment);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

router.patch("/enrollments/:id", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const data = insertCourseEnrollmentSchema.partial().parse(req.body);
    const updated = await storage.updateCourseEnrollment(req.params.id, data);
    res.json(updated);
  } catch (error: any) {
    handleValidationError(error, res);
  }
});

export default router;

