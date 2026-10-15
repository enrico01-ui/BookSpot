
export const openapiSpec = {
  openapi: "3.0.3",

  info: {
    title: "BookSpot API",
    version: "1.0.0",
    description: "API documentation for the BookSpot booking application.",
  },

  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server",
    },
  ],

  tags: [
    {
      name: "Auth",
      description: "Authentication and user session endpoints",
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: {
            type: "string",
            example: "Budi Santoso",
          },
          email: {
            type: "string",
            format: "email",
            example: "budi@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "ExamplePassword123!",
          },
          phone: {
            type: "string",
            nullable: true,
            example: "081234567890",
          },
          avatarUrl: {
            type: "string",
            format: "uri",
            nullable: true,
            example: "https://example.com/avatar.jpg",
          },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "budi@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "ExamplePassword123!",
          },
        },
      },
    },
  },

  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Create a new BookSpot account.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered successfully.",
          },
          "400": {
            description: "Invalid request data.",
          },
          "409": {
            description: "Email already exists.",
          },
          "429": {
            description: "Too many registration requests.",
          },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        description: "Authenticate a user and issue tokens.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful.",
          },
          "400": {
            description: "Invalid request data.",
          },
          "401": {
            description: "Invalid credentials.",
          },
          "429": {
            description: "Too many login attempts.",
          },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        description: "Return the profile of the authenticated user.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user returned successfully.",
          },
          "401": {
            description: "Missing or invalid access token.",
          },
        },
      },
    },

    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh authentication tokens",
        description: "Issue a new access token using a refresh token.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: {
                    type: "string",
                    description: "The refresh token issued during authentication.",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Tokens refreshed successfully.",
          },
          "401": {
            description: "Refresh token is invalid, expired, or revoked.",
          },
          "429": {
            description: "Too many refresh requests.",
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        description: "Invalidate the current refresh token and log out the user.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "User logged out successfully.",
          },
          "401": {
            description: "Missing or invalid access token.",
          },
          "429": {
            description: "Too many logout requests.",
          },
        }
      }
    },
    '/api/auth/me/update': {
      put: {
        tags: ['Auth'],
        summary: 'Update current user',
        description: 'Update the profile of the authenticated user.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateUserRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User updated successfully.',
          },
          '400': {
            description: 'Invalid request data.',
          },
          '401': {
            description: 'Missing or invalid access token.',
          },
        },
      }
    }
  },
};