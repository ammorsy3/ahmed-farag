import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number; // seconds, to stagger neighbours
  as?: 'div' | 'article' | 'footer';
};

// Fades and lifts its content in once, the first time it scrolls into view.
export default function Reveal({ children, className, delay = 0, as = 'div' }: Props) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];
  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}
