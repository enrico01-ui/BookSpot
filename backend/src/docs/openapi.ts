
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
    {
      name: "Venues",
      description: "Venue management endpoints",
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
       CreateVenueRequest: {
        type: "object",
        required: ["name", "address", "city"],
        properties: {
          name: { type: "string", minLength: 3, maxLength: 100, example: "GOR Futsal Sentosa" },
          address: { type: "string", minLength: 5, example: "Jl. Merdeka No. 45" },
          city: { type: "string", minLength: 2, example: "Jakarta" },
          latitude: { type: "number", minimum: -90, maximum: 90, nullable: true, example: -6.2088 },
          longitude: { type: "number", minimum: -180, maximum: 180, nullable: true, example: 106.8456 },
          description: { type: "string", maxLength: 1000, nullable: true, example: "Lapangan futsal rumput sintetis standar internasional." },
        },
      },

      UpdateVenueRequest: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 3, maxLength: 100, example: "GOR Futsal Sentosa Renovation" },
          address: { type: "string", minLength: 5, example: "Jl. Merdeka No. 46" },
          city: { type: "string", minLength: 2, example: "Jakarta Selatan" },
          latitude: { type: "number", minimum: -90, maximum: 90, nullable: true, example: -6.2088 },
          longitude: { type: "number", minimum: -180, maximum: 180, nullable: true, example: 106.8456 },
          description: { type: "string", maxLength: 1000, nullable: true, example: "Deskripsi venue diperbarui." },
        },
      },

      VenueResponse: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "GOR Futsal Sentosa" },
          address: { type: "string", example: "Jl. Merdeka No. 45" },
          city: { type: "string", example: "Jakarta" },
          latitude: { type: "number", nullable: true, example: -6.2088 },
          longitude: { type: "number", nullable: true, example: 106.8456 },
          description: { type: "string", nullable: true, example: "Lapangan futsal rumput sintetis." },
          status: { type: "string", enum: ["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "SUSPENDED", "REJECTED"], example: "DRAFT" },
          ownerId: { type: "integer", example: 5 },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
    },
    "/api/venues": {
      post: {
        tags: ["Venues"],
        summary: "Create a new venue",
        description: "Allowed roles: ADMIN, OWNER",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateVenueRequest" },
            },
          },
        },
        responses: {
          "201": { description: "Venue created successfully." },
          "400": { description: "Invalid request data." },
          "401": { description: "Unauthorized." },
          "403": { description: "Forbidden." },
        },
      },
      get: {
        tags: ["Venues"],
        summary: "Get list of venues",
        description: "Allowed roles: ADMIN, OWNER, USER",
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: "query", name: "ownerId", schema: { type: "integer" }, description: "Filter by owner ID" },
          { in: "query", name: "status", schema: { type: "string", enum: ["DRAFT", "PENDING_APPROVAL", "PUBLISHED", "SUSPENDED", "REJECTED"] }, description: "Filter by status" },
          { in: "query", name: "city", schema: { type: "string" }, description: "Filter by city" },
          { in: "query", name: "page", schema: { type: "integer", default: 1 }, description: "Page number" },
          { in: "query", name: "limit", schema: { type: "integer", default: 10 }, description: "Items per page" },
        ],
        responses: {
          "200": { description: "Venues retrieved successfully." },
          "401": { description: "Unauthorized." },
        },
      },
    },

    "/api/venues/{id}": {
      get: {
        tags: ["Venues"],
        summary: "Get venue by ID",
        description: "Allowed roles: ADMIN, OWNER, USER",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "Venue ID",
          },
        ],
        responses: {
          "200": { description: "Venue details retrieved successfully." },
          "401": { description: "Unauthorized." },
          "404": { description: "Venue not found." },
        },
      },
      put: {
        tags: ["Venues"],
        summary: "Update venue by ID",
        description: "Allowed roles: ADMIN, OWNER",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "Venue ID",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateVenueRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Venue updated successfully." },
          "400": { description: "Invalid request data." },
          "401": { description: "Unauthorized." },
          "403": { description: "Forbidden." },
          "404": { description: "Venue not found." },
        },
      },
      delete: {
        tags: ["Venues"],
        summary: "Delete venue by ID",
        description: "Allowed roles: ADMIN, OWNER",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "integer" },
            description: "Venue ID",
          },
        ],
        responses: {
          "200": { description: "Venue deleted successfully." },
          "401": { description: "Unauthorized." },
          "403": { description: "Forbidden." },
          "404": { description: "Venue not found." },
        },
      },
    },
  },
};