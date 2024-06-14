import { Injectable, NestMiddleware, UnauthorizedException ,Logger} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  private excludedRoutes = ['/auth/signupWithCv','/auth/signupWithoutCv','/auth/signin','/auth/simplySignup']; // Routes to exclude

  use(req: Request, res: Response, next: NextFunction) {
    const { url } = req;
    Logger.log(req.url,req.baseUrl)
    if (this.excludedRoutes.includes(url)) {
      next(); // Skip middleware for excluded routes
    } else {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Invalid or missing token');
      }

      const token = authHeader.split(' ')[1];
      try {
        const decodedToken = jwt.verify(token,process.env.AT_SECRET); // Replace with your secret key

        // If you have additional checks or validations for the decoded token, you can perform them here

        // Attach the decoded token payload to the request object for further usage in subsequent middleware/controllers
        req.user = decodedToken;

        next();
      } catch (error) {
        throw new UnauthorizedException('Invalid token');
      }
    }
  }
}
