import { Controller, Get, HttpStatus, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ChatService } from "../chat/service/chat.service";
import { RandomService } from "./random.service";
import { UserDto } from "../chat/dtos/chat.dto";
import { Request } from "express";

@UseGuards(AuthGuard("jwt"))
@ApiTags("conversation")
@ApiBearerAuth()
@Controller("conversation")
export class SocketController {
  constructor(private readonly randomService: RandomService) {
  }

  @Get("/")
  @ApiOperation({ summary: "Get conversations for the authenticated user" })
  @ApiOkResponse({ status: HttpStatus.OK, description: "List of conversations for the user", type: [UserDto] })
  async getConversations(@Req() req: Request) {
    const userId = req.user["sub"];
    return await this.randomService.getChatsByUser(userId);
  }

}