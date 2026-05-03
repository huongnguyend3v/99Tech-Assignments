import { body, query, validationResult } from 'express-validator';

const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateGetUsersQuery = [
  query('limit').optional().isInt({ min: 0 }).toInt().withMessage('Invalid limit. Must be a non-negative integer.'),
  query('offset').optional().isInt({ min: 0 }).toInt().withMessage('Invalid offset. Must be a non-negative integer.'),
  query('filterColumn').optional().isIn(['name', 'email']).withMessage('Invalid filterColumn. Must be "name" or "email"'),
  query('filterValue')
    .optional()
    .isString()
    .withMessage('filterValue must be a string')
    .custom((value, { req }) => {
      if (value && !req.query?.filterColumn) {
        throw new Error('filterValue requires filterColumn to be set.');
      }
      return true;
    }),
  query('sortColumn').optional().isIn(['name', 'email']).withMessage('Invalid sortColumn. Must be "name" or "email"'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Invalid sortOrder. Must be "ASC" or "DESC"'),
  handleValidationErrors,
];

export const validateCreateUserBody = [
  body('name').exists().withMessage('Name is required').bail().isString().withMessage('Name must be a string').bail().notEmpty().withMessage('Name is required'),
  body('email').exists().withMessage('Valid email is required').bail().isEmail().withMessage('Valid email is required'),
  handleValidationErrors,
];

export const validateUpdateUserBody = [
  body('name').optional().isString().withMessage('Name must be a string'),
  body('email').optional().isEmail().withMessage('Must be a valid email'),
  body().custom((value) => {
    if (!value.name && !value.email) {
      throw new Error('At least one of name or email must be provided');
    }
    return true;
  }),
  handleValidationErrors,
];