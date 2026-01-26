import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const Card = ({ title, value, icon }: CardProps) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.label}>{title}</p>
          <h3 className={styles.value}>{value}</h3>
        </div>
        <div className={styles.iconWrapper}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Card;