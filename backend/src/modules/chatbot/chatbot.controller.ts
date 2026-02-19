import { Controller, Post, Body, Session, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotDto } from './dto/chatbot-dto';
import { SessionAuthGuard } from '../../common/guards/session-auth.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  async chat(@Session() session: Record<string, any>, @Body() dto: ChatbotDto) {
    return this.chatbotService.chat(session.userId, dto);
  }
}
