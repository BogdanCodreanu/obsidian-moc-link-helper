import { Bird } from 'lucide-react';
import Description from './Description';

const NoFileSelectedScreen = () => {
  return (
    <div className="flex flex-col gap-s pt-xl">
      <Description text={'No file selected.'} bigCenterIcon={<Bird size={32} />} />
    </div>
  );
};

export default NoFileSelectedScreen;
