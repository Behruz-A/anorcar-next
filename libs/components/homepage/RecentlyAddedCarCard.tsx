import React from 'react';
import { Car } from '../../types/car/car';
import CarCard from '../car/CarCard';

const RecentlyAddedCarCard = ({ car }: { car: Car }) => <CarCard car={car} variant="recent" />;

export default RecentlyAddedCarCard;
