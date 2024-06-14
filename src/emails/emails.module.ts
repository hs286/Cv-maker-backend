import { Module, forwardRef } from "@nestjs/common";
import { EmailSendingService } from "./services/email.service";
import { EmailController } from "./controllers/email.controller";
import { AuthModule } from "../auth/0auth2.0/auth.module";

@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers: [EmailController],
    providers: [EmailSendingService],
    exports: [EmailSendingService],
})
export class EmailsModule {}
