import { useEditableBinding } from '../../hooks/useEditableBinding';
import type { HomeHeroStat } from '../../lib/content/homeHero';

interface HeroStatCardProps {
  stat: HomeHeroStat;
  index: number;
  onSaveStat: (stat: HomeHeroStat) => Promise<void>;
}

export const HeroStatCard = ({ stat, index, onSaveStat }: HeroStatCardProps) => {
  const valueEdit = useEditableBinding({
    value: stat.value,
    onSave: (next) => onSaveStat({ ...stat, value: next }),
    label: `Hero stat ${index + 1} — value`,
  });
  const labelEdit = useEditableBinding({
    value: stat.label,
    onSave: (next) => onSaveStat({ ...stat, label: next }),
    label: `Hero stat ${index + 1} — label`,
  });
  return (
    <div className="rounded-2xl border border-white/15 bg-black/30 p-4 text-center backdrop-blur-sm">
      <div className="font-display gradient-text text-3xl font-bold md:text-4xl">
        <span {...valueEdit.bindProps}>{valueEdit.value}</span>
      </div>
      <div className="mt-1 text-sm text-gray-300">
        <span {...labelEdit.bindProps}>{labelEdit.value}</span>
      </div>
    </div>
  );
};
