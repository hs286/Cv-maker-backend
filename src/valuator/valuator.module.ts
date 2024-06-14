import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ValuatorController } from "./controllers/valuator.controller";
import { ValuatorService } from "./services/valuator.service";
import { HttpModule } from "@nestjs/axios";
import { Valuator } from "./entities/valuator.entity";
import { User } from "src/auth/0auth2.0/entites/user.entity";
import { CVProfile } from "src/profile/entities/CVProfile.entity";
import { WebSocketModule } from "src/websocket/websocket.module";
@Module({
    imports: [
        TypeOrmModule.forFeature([Valuator, User, CVProfile]),
        HttpModule,
        forwardRef(() => WebSocketModule),
    ],
    controllers: [ValuatorController],
    providers: [ValuatorService],
    exports: [ValuatorService],
})
export class ValuatorModule {}
