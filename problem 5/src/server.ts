import express from 'express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const appUrl = process.env.URL || `http://localhost:${port}`;

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Express.js CRUD API',
    version: '1.0.0',
    description: 'A simple backend server with CRUD operations for user management',
  },
  servers: [
    {
      url: appUrl,
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'UUID of the user',
          },
          name: {
            type: 'string',
            description: 'User name',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          msg: {
            type: 'string',
            description: 'Validation error message',
          },
          param: {
            type: 'string',
            description: 'Parameter name that caused the error',
          },
          location: {
            type: 'string',
            description: 'Location of the parameter in the request',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          errors: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ValidationError',
            },
          },
        },
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

// Middleware
app.use(express.json());

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API routes
app.use('/api/users', userRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});