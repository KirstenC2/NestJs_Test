# NestJS

## Core files
### app.controller.ts
- basic controller with a single route
### app.controller.spec.ts
- The unit tests for the controller.
### app.module.ts
- The root module of the application.
### app.service.ts
- basic service with a single method.
### main.ts
- The entry point of the application.


## Controllers
- responsible for **handling incoming requests and returning responses**
- a controller can have multiple routes, and each route can perform a different action.
- to create a controller, use the `@Controller` decorator

## Providers
- core concept in NestJS
- Providers example: basic Nest classes, such as services, repositories, and helpers
- key of providers:
    - it can be injected as a dependency
    - allowing objetcs to form various relationships with each other

### Routing Mechanism
- determines which controller will handle each request.



## Services


## Guards
- a class annotated with the @Injectable() decorator
- it will implements the *CanActivate* interface
- Single responsibility
    - determine whether a request should be allowed to proceed or not (often referred to as authorization)
- IE: Guard who protects the route
    


