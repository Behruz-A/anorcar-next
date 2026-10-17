import { JwtPayload } from 'jwt-decode';
import { AgentType, AgentLanguage } from '../enums/member.enum';

export interface CustomJwtPayload extends JwtPayload {
	agentType?: AgentType | null;
	agentLanguages?: AgentLanguage[] | null;
	_id: string;
	memberType: string;
	memberStatus: string;
	memberAuthType: string;
	memberPhone: string;
	memberNick: string;
	memberFullName?: string;
	memberImage?: string;
	memberAddress?: string;
	memberDesc?: string;
	memberCars: number;
	memberRank: number;
	memberArticles: number;
	memberPoints: number;
	memberLikes: number;
	memberViews: number;
	memberFollowers: number;
	memberFollowings: number;
	memberComments: number;
	memberWarnings: number;
	memberBlocks: number;
}
