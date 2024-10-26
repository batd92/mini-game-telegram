import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ReferralModule } from 'modules/referral/referral.module';
import { GameHistoryModule } from 'modules/game-history/game-history.module';
import { TaskHistoryModule } from 'modules/task-history/task-history.module';
import { GameUserModule } from 'modules/game-profile/game-profile.module';
import { TelegramUserService } from './telegram-user.service';
import { TelegramUserController } from './telegram-user.controller';

@Module({
    imports: [
        DatabaseModule,
        ReferralModule,
        GameHistoryModule,
        TaskHistoryModule,
        GameUserModule,
    ],
    providers: [
        TelegramUserService,
    ],
    exports: [TelegramUserService],
    controllers: [TelegramUserController],
})
export class TelegramUserModule {}
