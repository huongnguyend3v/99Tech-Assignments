import { param, validationResult } from 'express-validator';

export const validateIdParam = [
  param('id').exists().withMessage('ID is required').bail().isUUID(4).withMessage('Invalid ID'),
  (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];