import React from 'react';
import { Car } from '../../types/car/car';
import { CustomJwtPayload } from '../../types/customJwtPayload';
import CarCard from '../car/CarCard';

interface TrendCarCardProps {
 car: Car;
 likeCarHandler: (user: CustomJwtPayload, id: string) => Promise<void>;
}

const TrendCarCard = ({ car, likeCarHandler }: TrendCarCardProps) =>
 <CarCard car={car} variant="trending" likeCarHandler={likeCarHandler} />;

export default TrendCarCard;
