import { gql } from '@apollo/client';

/**************************
 *         MEMBER         *
 *************************/

export const GET_AGENTS = gql`
	query GetAgents($input: AgentsInquiry!) {
		getAgents(input: $input) {
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
				memberPoints
				memberLikes
				memberViews
				deletedAt
				createdAt
				updatedAt
				accessToken
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

export const GET_MEMBER = gql(`
 query GetMember($input: String!) {
    getMember(memberId: $input) {
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
        memberArticles
        memberPoints
        memberLikes
        memberViews
        memberFollowings
				memberFollowers
        memberRank
        memberWarnings
        memberBlocks
        deletedAt
        createdAt
        updatedAt
        accessToken
        meFollowed {
					followingId
					followerId
					myFollowing
				}
        meLiked {
          memberId
          likeRefId
          myFavorite
        }
    }
}
`);







/**************************
 *      BOARD-ARTICLE     *
 *************************/

export const GET_BOARD_ARTICLE = gql`
	query GetBoardArticle($input: String!) {
		getBoardArticle(articleId: $input) {
			_id
			articleCategory
			articleStatus
			articleTitle
			articleContent
			articleImage
			articleViews
			articleLikes
			articleComments
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
			}
			meLiked {
				memberId
				likeRefId
				myFavorite
			}
		}
	}
`;

export const GET_BOARD_ARTICLES = gql`
	query GetBoardArticles($input: BoardArticlesInquiry!) {
		getBoardArticles(input: $input) {
			list {
				_id
				articleCategory
				articleStatus
				articleTitle
				articleContent
				articleImage
				articleViews
				articleLikes
				articleComments
				memberId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
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
 *         FOLLOW        *
 *************************/
export const GET_MEMBER_FOLLOWERS = gql`
	query GetMemberFollowers($input: FollowInquiry!) {
		getMemberFollowers(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
				}
				followerData {
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
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
				}
			}
			metaCounter {
				total
			}
		}
	}
`;

export const GET_MEMBER_FOLLOWINGS = gql`
	query GetMemberFollowings($input: FollowInquiry!) {
		getMemberFollowings(input: $input) {
			list {
				_id
				followingId
				followerId
				createdAt
				updatedAt
				followingData {
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
					memberArticles
					memberPoints
					memberLikes
					memberViews
					memberComments
					memberFollowings
					memberFollowers
					memberRank
					memberWarnings
					memberBlocks
					deletedAt
					createdAt
					updatedAt
					accessToken
				}
				meLiked {
					memberId
					likeRefId
					myFavorite
				}
				meFollowed {
					followingId
					followerId
					myFollowing
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

export const GET_CAR = gql`
query GetCar($input: String!) {
  getCar(carId: $input) {
    _id
    carStatus
    carFuelType
    carCondition
    carModel
    carYear
    carMileage
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

export const GET_CARS = gql`
query GetCars($input: CarsInquiry!) {
  getCars(input: $input) {
    list {
      _id
      carStatus
      carFuelType
      carCondition
      carModel
      carYear
      carMileage
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
 * CAR
 *************************/

export const GET_AGENT_CARS = gql`
query GetAgentCars($input: AgentCarsInquiry!) {
  getAgentCars(input: $input) {
    list {
      _id
      carStatus
      carFuelType
      carCondition
      carModel
      carYear
      carMileage
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
 * CAR
 *************************/

export const GET_FAVORITES = gql`
query GetFavorites($input: OrdinaryInquiry!) {
  getFavorites(input: $input) {
    list {
      _id
      carStatus
      carFuelType
      carCondition
      carModel
      carYear
      carMileage
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
 * CAR
 *************************/

export const GET_VISITED = gql`
query GetVisited($input: OrdinaryInquiry!) {
  getVisited(input: $input) {
    list {
      _id
      carStatus
      carFuelType
      carCondition
      carModel
      carYear
      carMileage
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

export const GET_BRANDS = gql`
query GetBrands {
  getBrands {
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

export const GET_BRAND = gql`
query GetBrand($input: String!) {
  getBrand(brandId: $input) {
    _id
    brandName
    brandLogo
    brandStatus
  }
}
`;
