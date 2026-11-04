import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
export default function HeartButton({ flower, liked, onToggle }) {
  return <button className={`heart-button ${liked ? 'is-liked' : ''}`} aria-label={`${liked ? 'Remove' : 'Save'} ${flower.name} ${liked ? 'from' : 'to'} wishlist`} aria-pressed={liked} onClick={() => onToggle(flower.id)}><FontAwesomeIcon icon={faHeart} /></button>;
}
