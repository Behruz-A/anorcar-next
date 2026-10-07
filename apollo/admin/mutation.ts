import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const UPDATE_MEMBER_BY_ADMIN = gql`
	mutation UpdateMemberByAdmin($input: MemberUpdate!) {
		updateMemberByAdmin(input: $input) {
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




/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const UPDATE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation UpdateBoardArticleByAdmin($input: BoardArticleUpdate!) {
		updateBoardArticleByAdmin(input: $input) {
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

export const REMOVE_BOARD_ARTICLE_BY_ADMIN = gql`
	mutation RemoveBoardArticleByAdmin($input: String!) {
		removeBoardArticleByAdmin(articleId: $input) {
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

export const REMOVE_COMMENT_BY_ADMIN = gql`
	mutation RemoveCommentByAdmin($input: String!) {
		removeCommentByAdmin(commentId: $input) {
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
 * CAR
 *************************/

export const UPDATE_CAR_BY_ADMIN = gql`
mutation UpdateCarByAdmin($input: CarUpdate!) {
  updateCarByAdmin(input: $input) {
    _id
    carStatus
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

export const REMOVE_CAR_BY_ADMIN = gql`
mutation RemoveCarByAdmin($input: String!) {
  removeCarByAdmin(carId: $input) {
    _id
    carStatus
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
 * BRAND
 *************************/

export const CREATE_BRAND = gql`
mutation CreateBrand($input: BrandInput!) {
  createBrand(input: $input) {
    _id
    brandName
    brandLogo
    brandStatus
  }
}
`;


/**************************
 * BRAND
 *************************/

export const UPDATE_BRAND_BY_ADMIN = gql`
mutation UpdateBrandByAdmin($input: BrandUpdate!) {
  updateBrandByAdmin(input: $input) {
    _id
    brandName
    brandLogo
    brandStatus
  }
}
`;


/**************************
 * BRAND
 *************************/

export const REMOVE_BRAND_BY_ADMIN = gql`
mutation RemoveBrandByAdmin($input: String!) {
  removeBrandByAdmin(brandId: $input) {
    _id
    brandName
    brandLogo
    brandStatus
  }
}
`;
