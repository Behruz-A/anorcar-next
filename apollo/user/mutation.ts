import { gql } from '@apollo/client';

export const ASK_AI_ASSISTANT = gql`
	mutation AskAiAssistant($input: AiChatInput!) {
		askAiAssistant(input: $input) { answer }
	}
`;

export const REFRESH_ACCESS_TOKEN = gql`
	mutation RefreshAccessToken {
		refreshAccessToken { accessToken }
	}
`;

export const LOGOUT = gql`
	mutation Logout { logout }
`;

export const CREATE_INQUIRY = gql`
	mutation CreateInquiry($input: InquiryInput!) {
		createInquiry(input: $input) {
			_id
			inquiryStatus
			createdAt
		}
	}
`;

/**************************
 *         MEMBER         *
 *************************/

export const SIGN_UP = gql`
	mutation Signup($input: MemberInput!) {
		signup(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberWarnings
			memberBlocks
			memberCars
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LOGIN = gql`
	mutation Login($input: LoginInput!) {
		login(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberWarnings
			memberBlocks
			memberCars
			memberRank
			memberPoints
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const UPDATE_MEMBER = gql`
	mutation UpdateMember($input: MemberUpdate!) {
		updateMember(input: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberCars
			memberRank
			memberArticles
			memberPoints
			memberLikes
			memberViews
			memberWarnings
			memberBlocks
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;

export const LIKE_TARGET_MEMBER = gql`
	mutation LikeTargetMember($input: String!) {
		likeTargetMember(memberId: $input) {
			_id
			memberType
			memberStatus
			memberAuthType
			memberPhone
			memberNick
			memberFullName
			memberImage
			memberAddress
			memberDesc
			memberWarnings
			memberBlocks
			memberCars
			memberRank
			memberPoints
			memberLikes
			memberViews
			deletedAt
			createdAt
			updatedAt
			accessToken
		}
	}
`;





/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const CREATE_BOARD_ARTICLE = gql`
	mutation CreateBoardArticle($input: BoardArticleInput!) {
		createBoardArticle(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_BOARD_ARTICLE = gql`
	mutation UpdateBoardArticle($input: BoardArticleUpdate!) {
		updateBoardArticle(input: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const LIKE_TARGET_BOARD_ARTICLE = gql`
	mutation LikeTargetBoardArticle($input: String!) {
		likeTargetBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const CREATE_COMMENT = gql`
	mutation CreateComment($input: CommentInput!) {
		createComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

export const UPDATE_COMMENT = gql`
	mutation UpdateComment($input: CommentUpdate!) {
		updateComment(input: $input) {
			_id
			commentStatus
			commentGroup
			commentContent
			commentRefId
			memberId
			createdAt
			updatedAt
		}
	}
`;

/**************************
 *         FOLLOW        *
 *************************/

export const SUBSCRIBE = gql`
	mutation Subscribe($input: String!) {
		subscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;

export const UNSUBSCRIBE = gql`
	mutation Unsubscribe($input: String!) {
		unsubscribe(input: $input) {
			_id
			followingId
			followerId
			createdAt
			updatedAt
		}
	}
`;


/**************************
 * CAR
 *************************/

export const CREATE_CAR = gql`
mutation CreateCar($input: CarInput!) {
  createCar(input: $input) {
    _id
    carStatus
    carBodyType
    carSegment
    carFuelType
    carCondition
    carModel
    carYear
    carLocation
    carAddress
    carTransmission
    carTitle
    carPrice
    carColor
    carViews
    carLikes
    carComments
    carRank
    carImages
    brandId
    carDesc
    carBarter
    carRent
    memberId
    soldAt
    deletedAt
    createdAt
    updatedAt
    brandData {
      _id
      brandName
      brandLogo
      brandStatus
    }
    memberData {
      _id
      memberType
      memberStatus
      memberNick
      memberPhone
      memberFullName
      memberImage
      memberAddress
      memberDesc
      memberCars
      memberLikes
      memberViews
    }
    meLiked {
      memberId
      likeRefId
      myFavorite
    }
  }
}
`;


/**************************
 * CAR
 *************************/

export const UPDATE_CAR = gql`
mutation UpdateCar($input: CarUpdate!) {
  updateCar(input: $input) {
    _id
    carStatus
    carBodyType
    carSegment
    carFuelType
    carCondition
    carModel
    carYear
    carLocation
    carAddress
    carTransmission
    carTitle
    carPrice
    carColor
    carViews
    carLikes
    carComments
    carRank
    carImages
    brandId
    carDesc
    carBarter
    carRent
    memberId
    soldAt
    deletedAt
    createdAt
    updatedAt
    brandData {
      _id
      brandName
      brandLogo
      brandStatus
    }
    memberData {
      _id
      memberType
      memberStatus
      memberNick
      memberPhone
      memberFullName
      memberImage
      memberAddress
      memberDesc
      memberCars
      memberLikes
      memberViews
    }
    meLiked {
      memberId
      likeRefId
      myFavorite
    }
  }
}
`;


/**************************
 * CAR
 *************************/

export const LIKE_TARGET_CAR = gql`
mutation LikeTargetCar($input: String!) {
  likeTargetCar(carId: $input) {
    _id
    carStatus
    carBodyType
    carSegment
    carFuelType
    carCondition
    carModel
    carYear
    carLocation
    carAddress
    carTransmission
    carTitle
    carPrice
    carColor
    carViews
    carLikes
    carComments
    carRank
    carImages
    brandId
    carDesc
    carBarter
    carRent
    memberId
    soldAt
    deletedAt
    createdAt
    updatedAt
    brandData {
      _id
      brandName
      brandLogo
      brandStatus
    }
    memberData {
      _id
      memberType
      memberStatus
      memberNick
      memberPhone
      memberFullName
      memberImage
      memberAddress
      memberDesc
      memberCars
      memberLikes
      memberViews
    }
    meLiked {
      memberId
      likeRefId
      myFavorite
    }
  }
}
`;
