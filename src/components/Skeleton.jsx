import React from 'react';
import './Skeleton.css';

const Skeleton = ({ type, classes }) => {
  const classNames = `skeleton ${type} ${classes || ''}`;
  return <div className={classNames}></div>;
};

export default Skeleton;
