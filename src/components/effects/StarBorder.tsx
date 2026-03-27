import { useEffect, useState, type ReactNode, type CSSProperties } from 'react';
import { useSiteSettingsContext } from '../../context/SiteSettingsContext';
import './StarBorder.css';

export type StarBorderVariant = 'button' | 'card' | 'link' | 'input' | 'default';

export interface StarBorderProps {
  children: ReactNode;
  variant?: StarBorderVariant;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

const variantClassMap: Record<StarBorderVariant, string> = {
  button: 'star-border-button',
  card: 'star-border-card',
  link: 'star-border-link',
  input: 'star-border-input',
  default: '',
};

export const StarBorder = ({
  children,
  variant = 'default',
  className = '',
  style,
  disabled = false,
}: StarBorderProps) => {
  const { settings } = useSiteSettingsContext();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(settings.starBorder?.enabled ?? false);
  }, [settings.starBorder?.enabled]);

  if (!isEnabled || disabled) {
    return <>{children}</>;
  }

  const variantClass = variantClassMap[variant];
  const combinedClassName = `star-border-container ${variantClass} ${className}`.trim();

  return (
    <div className={combinedClassName} style={style}>
      <div className="border-gradient-top" />
      <div className="border-gradient-bottom" />
      <div className="inner-content">
        {children}
      </div>
    </div>
  );
};

export default StarBorder;
