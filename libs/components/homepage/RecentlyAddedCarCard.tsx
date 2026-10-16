import React from 'react';
import { Car } from '../../types/car/car';
import CarCard from '../car/CarCard';
import { CustomJwtPayload } from '../../types/customJwtPayload';

interface RecentlyAddedCarCardProps {
 car: Car;
 likeCarHandler: (user: CustomJwtPayload, id: string) => Promise<void>;
}

const RecentlyAddedCarCard = ({ car, likeCarHandler }: RecentlyAddedCarCardProps) => <CarCard car={car} variant="recent" likeCarHandler={likeCarHandler} />;

export default RecentlyAddedCarCard;
