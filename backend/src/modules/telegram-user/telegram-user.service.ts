import { Inject, Injectable } from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { ReferralService } from 'modules/referral/referral.service';
import { GameHistoryService } from 'modules/game-history/game-history.service';
import { TaskHistoryService } from 'modules/task-history/task-history.service';
import { Model, Types } from 'mongoose';
import { TELEGRAM_USER_MODEL } from 'database/constants';
import { ITelegramUser } from 'modules/telegram/interfaces/telegram.interface';
import { GameProfileService } from 'modules/game-profile/game-profile.service';
import { TelegramUser } from 'database/schemas/telegram-user.schema';
import { IMe } from './dto/IMe';

@Injectable()
export class TelegramUserService {
    constructor(
        @Inject(TELEGRAM_USER_MODEL) private telegramUserModel: Model<TelegramUser>,
        private readonly referralService: ReferralService,
        private readonly gameHistoryService: GameHistoryService,
        private readonly taskHistoryService: TaskHistoryService,
        private readonly gameProfileService: GameProfileService

    ) { }

    findByUsernameAndTelegramId(user_name: string, telegram_id: string): Observable<TelegramUser> {
        return from(this.telegramUserModel.findOne({ user_name, telegram_id }).exec());
    }
    

    async findByAuthReq(telegram_id: string): Promise<Partial<TelegramUser>> {
        return this.telegramUserModel.findOne({ telegram_id }).exec()
    }    

    async findByUserId(id: string): Promise<{ data: IMe }> {
    const user = await this.telegramUserModel.findOne({ _id: new Types.ObjectId(id) }).exec();

    if (!user) {
        throw new Error('User not found');
    }

    const totalGameScore = await this.gameHistoryService.getTotalScore(id).toPromise();
    const totalTaskScore = await this.taskHistoryService.getTotalScore(id).toPromise();
    const { data } = await this.referralService.getReferralStats(id).toPromise();
    const gameInfo = await this.gameProfileService.getGameUserById(id).toPromise();

    return {
        data: {
            _id: user._id.toString(),
            telegram_id: user.telegram_id,
            user_name: user.user_name,
            first_name: user.first_name,
            language_code: user.language_code,
            id: user.id,
            analytics: {
                game_score: totalGameScore,
                task_score: totalTaskScore,
                referral_score: data.length * 100,
                total_referrals: data.length,
            },
            game_info: {
                number_of_attempts: gameInfo.number_of_attempts,
                remaining_play: gameInfo.remaining_play,
                earned_points: gameInfo.earned_points,
            },
        },
    };
}

    async register(data: ITelegramUser): Promise<TelegramUser> {
        console.log('user telegram ', data);

        try {
            const newTelegramUser = await this.telegramUserModel.create([{
                telegram_id: data.id.toString(),
                user_name: data.user_name,
                is_bot: data.is_bot,
                first_name: data.first_name,
                last_name: data.last_name,
                language_code: data.language_code,
                can_join_groups: data.can_join_groups,
                supports_inline_queries: data.supports_inline_queries,
                can_read_all_group_messages: data.can_read_all_group_messages,
                referral_code: data.referral_code
            }]);
    
            this.gameProfileService.save({
                user_id: newTelegramUser[0]._id.toString(),
                number_of_attempts: 0,
                remaining_play: 5,
                score: 100,
            });
    
            if (data.referral_code) {
                this.referralService.save({
                    user_id: data.referral_code,
                    referred_user_id: newTelegramUser[0]._id.toString(),
                    score: 100,
                });
            }

            return newTelegramUser[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw new Error(`User registration failed: ${error.message}`);
        }
    }
}
