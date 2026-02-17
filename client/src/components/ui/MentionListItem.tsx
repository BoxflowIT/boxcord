// Individual mention autocomplete list item
import Avatar from './Avatar';
import { MentionItem } from '../MentionAutocomplete';

interface MentionListItemProps {
  item: MentionItem;
  selected: boolean;
  onClick: () => void;
}

export default function MentionListItem({
  item,
  selected,
  onClick
}: MentionListItemProps) {
  return (
    <li
      onClick={onClick}
      className={`popup-list-item flex items-center gap-3 ${
        selected ? 'popup-list-item-selected' : 'popup-list-item-default'
      }`}
    >
      <Avatar size="sm">{item.display[0].toUpperCase()}</Avatar>
      <div>
        <div className="font-medium">{item.display}</div>
        <div className="text-subtle">{item.value}</div>
      </div>
    </li>
  );
}
