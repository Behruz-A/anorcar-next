import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_ALL_MEMBERS_BY_ADMIN = gql`
	query GetAllMembersByAdmin($input: MembersInquiry!) {
		getAllMembersByAdmin(input: $input) {
			list {
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
			metaCounter {
				total
			}
		}
	}
`;



/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_ALL_BOARD_ARTICLES_BY_ADMIN = gql`
	query GetAllBoardArticlesByAdmin($input: AllBoardArticlesInquiry!) {
		getAllBoardArticlesByAdmin(input: $input) {
			list {
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
				memberData {
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
			metaCounter {
				total
			}
		}
	}
`;

/**************************
 *         COMMENT        *
 *************************/

export const GET_COMMENTS = gql`
	query GetComments($input: CommentsInquiry!) {
		getComments(input: $input) {
			list {
				_id
				commentStatus
				commentGroup
				commentContent
				commentRefId
				memberId
				createdAt
				updatedAt
				memberData {
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
			metaCounter {
				total
			}
		}
	}
`;


/**************************
 * CAR
 *************************/

export const GET_ALL_CARS_BY_ADMIN = gql`
query GetAllCarsByAdmin($input: AllCarsInquiry!) {
  getAllCarsByAdmin(input: $input) {
    list {
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
    metaCounter {
      total
    }
  }
}
`;


/**************************
 * BRAND
 *************************/

export const GET_ALL_BRANDS_BY_ADMIN = gql`
query GetAllBrandsByAdmin {
  getAllBrandsByAdmin {
    _id
    brandName
    brandLogo
    brandStatus
  }
}
`;
