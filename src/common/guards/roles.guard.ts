// import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { type Role, ROLES_KEY } from "../decorators/roles.decorator";
// import type { AuthenticatedUser } from "../types/authenticated-user";

// @Injectable()
// export class RolesGuard implements CanActivate{
//     constructor(private reflector: Reflector){}

//     canActivate(context: ExecutionContext): boolean {
//         const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
//             context.getHandler(),
//             context.getClass(),
//         ])

//         if(!requiredRoles || requiredRoles.length === 0){
//             return true;
//         }

//         const { user } = context
//         .switchToHttp()
//         .getRequest<Request & {user: AuthenticatedUser }>(); 

//         const hasRole = requiredRoles.includes(user.role);

//         if(!hasRole){
//             throw new ForbiddenException('No tienes permisos para acceder a este recurso');
//         }
//         return true;
//     }
// }