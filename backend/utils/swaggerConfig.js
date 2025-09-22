// backend/utils/swaggerConfig.js
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WebSphere API',
      version: '1.0.0',
      description: 'A comprehensive freelancer marketplace platform API',
      contact: {
        name: 'WebSphere Team',
        email: 'support@websphere.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      },
      {
        url: 'https://api.websphere.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['fullName', 'email', 'role'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            fullName: {
              type: 'string',
              description: 'Full name of the user'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            role: {
              type: 'string',
              enum: ['client', 'freelancer', 'admin'],
              description: 'User role'
            },
            skills: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'User skills (freelancers only)'
            },
            isActive: {
              type: 'boolean',
              description: 'Account status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        Project: {
          type: 'object',
          required: ['title', 'description', 'client', 'budget'],
          properties: {
            _id: {
              type: 'string',
              description: 'Project ID'
            },
            title: {
              type: 'string',
              description: 'Project title'
            },
            description: {
              type: 'string',
              description: 'Project description'
            },
            client: {
              $ref: '#/components/schemas/User'
            },
            budget: {
              type: 'object',
              properties: {
                min: {
                  type: 'number',
                  description: 'Minimum budget'
                },
                max: {
                  type: 'number',
                  description: 'Maximum budget'
                }
              }
            },
            skillsRequired: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Required skills'
            },
            status: {
              type: 'string',
              enum: ['active', 'in_progress', 'completed', 'cancelled'],
              description: 'Project status'
            },
            deadline: {
              type: 'string',
              format: 'date-time',
              description: 'Project deadline'
            }
          }
        },
        Application: {
          type: 'object',
          required: ['project', 'freelancer', 'proposedRate', 'coverLetter'],
          properties: {
            _id: {
              type: 'string',
              description: 'Application ID'
            },
            project: {
              $ref: '#/components/schemas/Project'
            },
            freelancer: {
              $ref: '#/components/schemas/User'
            },
            proposedRate: {
              type: 'number',
              description: 'Freelancer proposed rate'
            },
            coverLetter: {
              type: 'string',
              description: 'Application cover letter'
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
              description: 'Application status'
            },
            submittedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Application submission date'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                code: {
                  type: 'string',
                  description: 'Error code'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './models/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'WebSphere API Documentation'
  }));
  
  // Raw JSON endpoint
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  console.log('📚 API Documentation available at /api/docs');
};

module.exports = { swaggerSetup, specs };